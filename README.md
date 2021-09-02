# platform-paths

Retrieve platform specific paths such as `downloads`, `documents`, etc.

Supports `linux`, `darwin`, and `win32` platforms.

Pros:

-   Tiny & simple.
-   No dependencies.
-   No native modules, bindings, or binaries.

Cons:

-   Potentially less robust than other alternatives.

## Install

```
npm install platform-folders
```

## Usage

```js
import {getPlatformPath, platformPaths, getDownloadsPath} from 'platform-paths';

const downloadsPath = await getPlatformPath('downloads');
// or
const downloadsPath = await platformPaths.download();
// or
const downloadsPath = await getDownloadsPath();
```

## API

Exported interfaces:

```ts
// Name getter
async function getPlatformPath(name: string): Promise<string>;

// Individual getters
async function getTmpPath(): Promise<string>;
async function getHomePath(): Promise<string>;
async function getDownloadsPath(): Promise<string>;
async function getDocumentsPath(): Promise<string>;
async function getPicturesPath(): Promise<string>;
async function getMusicPath(): Promise<string>;
async function getVideosPath(): Promise<string>;
async function getDesktopPath(): Promise<string>;

// Individual getters as a map
const platformPaths = {
	tmp: () => Promise<string>,
	home: () => Promise<string>,
	downloads: () => Promise<string>,
	documents: () => Promise<string>,
	pictures: () => Promise<string>,
	music: () => Promise<string>,
	videos: () => Promise<string>,
	desktop: () => Promise<string>,
};
```

## License

MIT
