import * as OS from 'os';
import * as CP from 'child_process';
import {promises as FSP} from 'fs';
import {promisify} from 'util';

const exec = promisify(CP.exec);

export const getTmpPath = async () => OS.tmpdir();
export const getHomePath = async () => OS.homedir();
export const getDownloadsPath = () => getPath('Downloads', 'Downloads', 'DOWNLOAD', 'Downloads', '/tmp/');
export const getDocumentsPath = () => getPath('Personal', 'Documents', 'DOCUMENTS', 'Documents');
export const getPicturesPath = () => getPath('My Pictures', 'Pictures', 'PICTURES', 'Pictures');
export const getMusicPath = () => getPath('My Music', 'Music', 'MUSIC', 'Music');
export const getVideosPath = () => getPath('My Video', 'Videos', 'VIDEOS', 'Videos');
export const getDesktopPath = () => getPath('Desktop', 'Desktop', 'DESKTOP', 'Desktop');

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

function isPathIdentifier(name: string): name is keyof typeof platformPaths {
	return platformPaths.hasOwnProperty(name);
}

export function getPlatformPath(name: string) {
	if (isPathIdentifier(name)) return platformPaths[name]();
	throw new Error(`Unknown platform path identifier "${name}".`);
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
		await FSP.access(path);
		return path;
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
