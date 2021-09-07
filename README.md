# platform-paths

Retrieve platform specific paths to user folders such as `downloads`, `documents`, etc.

Supports `linux`, `darwin`, and `win32` platforms.

Available paths: `tmp`, `home`, `downloads`, `documents`, `pictures`, `music`, `videos`, `desktop`.

Retrieval methods:

-   Linux: uses `xdg-user-dir` with a fallback to standard path names.
-   Windows: uses `reg query` to retrieve and parse out the paths with a fallback to standard path names.
-   macOS: simply constructs the standard path, as afaik these don't change on mac.

Pros:

-   Tiny & simple.
-   No dependencies.
-   No native modules, bindings, or binaries.
-   Built in caching.

Cons:

-   Potentially less robust than other alternatives.

## Install

```
npm install platform-paths
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
interface Options {
	maxAge?: number; // milliseconds, default: 0 (no caching)
}

// Name getter
async function getPlatformPath(name: string, options?: Options): Promise<string>;

// Individual getters
async function getTmpPath(options?: Options): Promise<string>;
async function getHomePath(options?: Options): Promise<string>;
async function getDownloadsPath(options?: Options): Promise<string>;
async function getDocumentsPath(options?: Options): Promise<string>;
async function getPicturesPath(options?: Options): Promise<string>;
async function getMusicPath(options?: Options): Promise<string>;
async function getVideosPath(options?: Options): Promise<string>;
async function getDesktopPath(options?: Options): Promise<string>;

// Individual getters as a map
const platformPaths = {
	tmp: (options?: Options) => Promise<string>,
	home: (options?: Options) => Promise<string>,
	downloads: (options?: Options) => Promise<string>,
	documents: (options?: Options) => Promise<string>,
	pictures: (options?: Options) => Promise<string>,
	music: (options?: Options) => Promise<string>,
	videos: (options?: Options) => Promise<string>,
	desktop: (options?: Options) => Promise<string>,
};

// Checks if string is a platform path identifier
// (one of platformPaths keys)
function isPlatformPathIdentifier(name: string): name is keyof typeof platformPaths;

// Manual cache clearing
function clearCache(): void;
```

### Caching

The retrieval methods for these paths are not _instant_, so if you're calling this a lot, you might want to enable caching.

This is done by simply passing a `maxAge` option to any of the exported methods. This options is `0` by default (caching disabled):

```js
// Re-queries when older than 10 seconds
const downloadsPath = getPlatformPath('downloads', {maxAge: 10_000});

// Only queries 1st time, then always cached
const downloadsPath = getDownloadsPath({maxAge: Infinity});
```

## License

MIT
