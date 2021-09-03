import * as OS from 'os';
import * as CP from 'child_process';
import {promises as FSP} from 'fs';
import {promisify} from 'util';

const exec = promisify(CP.exec);
const cachedPaths = new Map<string, CachedPath>();

interface CachedPath {
	value: string;
	createdAt: number;
}

export interface Options {
	maxAge?: number;
}

const getters = {
	tmp: async () => OS.tmpdir(),
	home: async () => OS.homedir(),
	downloads: () => getPath('Downloads', 'Downloads', 'DOWNLOAD', 'Downloads', '/tmp/'),
	documents: () => getPath('Personal', 'Documents', 'DOCUMENTS', 'Documents'),
	pictures: () => getPath('My Pictures', 'Pictures', 'PICTURES', 'Pictures'),
	music: () => getPath('My Music', 'Music', 'MUSIC', 'Music'),
	videos: () => getPath('My Video', 'Videos', 'VIDEOS', 'Videos'),
	desktop: () => getPath('Desktop', 'Desktop', 'DESKTOP', 'Desktop'),
};

export async function getPlatformPath(name: string, {maxAge = 0}: Options = {}): Promise<string> {
	if (!isPathIdentifier(name)) throw new Error(`Unknown platform path identifier "${name}".`);

	// Attempt to resolve from cached map
	const cached = cachedPaths.get(name);
	if (cached && Date.now() - cached.createdAt < maxAge) return cached.value;

	// Retrieve the value
	const value = await getters[name]();
	cachedPaths.set(name, {value, createdAt: Date.now()});

	return value;
}

export const getTmpPath = (options?: Options) => getPlatformPath('tmp', options);
export const getHomePath = (options?: Options) => getPlatformPath('home', options);
export const getDownloadsPath = (options?: Options) => getPlatformPath('downloads', options);
export const getDocumentsPath = (options?: Options) => getPlatformPath('documents', options);
export const getPicturesPath = (options?: Options) => getPlatformPath('pictures', options);
export const getMusicPath = (options?: Options) => getPlatformPath('music', options);
export const getVideosPath = (options?: Options) => getPlatformPath('videos', options);
export const getDesktopPath = (options?: Options) => getPlatformPath('desktop', options);

export const platformPaths = {
	tmp: getTmpPath,
	home: getHomePath,
	downloads: getDownloadsPath,
	documents: getDocumentsPath,
	pictures: getPicturesPath,
	music: getMusicPath,
	videos: getVideosPath,
	desktop: getDesktopPath,
};

export function clearCache() {
	cachedPaths.clear();
}

function isPathIdentifier(name: string): name is keyof typeof getters {
	return getters.hasOwnProperty(name);
}

async function getPath(winName: string, darwinName: string, xdgName: string, linuxName: string, linuxBackup?: string) {
	switch (OS.platform()) {
		case 'win32':
			return getWinRegistryPath(winName);
		case 'darwin':
			return `${OS.homedir()}/${darwinName}`;
		case 'linux':
			return getLinuxPath(xdgName, linuxName, linuxBackup);
	}
	throw new Error(`Unsupported platform.`);
}

async function getLinuxPath(xdgName: string, folderName: string, fallback?: string) {
	const homeDir = OS.homedir();

	try {
		let path = (await exec(`xdg-user-dir ${xdgName}`, {encoding: 'utf8'})).stdout.trim();
		if (path && path !== homeDir) return path;
	} catch {}

	try {
		const path = `${homeDir}/${folderName}`;
		if ((await FSP.stat(path)).isDirectory()) return path;
	} catch {}

	if (fallback) return fallback;

	throw new Error(`Couldn't resolve Documents directory.`);
}

async function getWinRegistryPath(name: string) {
	const key = name === 'Downloads' ? '{374DE290-123F-4565-9164-39C4925E467B}' : name;
	const homeDir = OS.homedir();

	const {stdout, stderr} = await exec(
		`reg query "HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\User Shell Folders"`
	);

	if (stderr) throw new Error(stderr);

	const match = new RegExp(`^ *${key} +REG_EXPAND_SZ +(?<value>.*)$`, 'i').exec(stderr);
	const value = match?.groups?.value;

	if (!value) {
		// Special case for downloads folder
		if (name === 'Downloads') return `${homeDir}\\Downloads`;

		throw new Error(`No registry match for "${name}". stdout:\n\n${stdout}`);
	}

	return value.replace('%USERPROFILE%', homeDir);
}
