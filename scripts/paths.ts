import path from 'path';
import url from 'url';

/**
 * Returns the full path of the root directory of this repository.
 */



export const ROOT_PATH = (() => {
    const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));
    const workspaceRoot = path.resolve(currentDirectory, '..');
    return workspaceRoot;
})();
export const SCRIPTS_PATH = path.join(ROOT_PATH, 'scripts');

export const SRC_PATH = path.resolve(ROOT_PATH, 'src');
export const BRIDGE_PATH = path.join(SRC_PATH, './bridge.tsx');
export const DIST_PATH = path.join(ROOT_PATH, 'dist');
export const BABEL_CONFIG_PATH = path.join(ROOT_PATH, 'babel.config.js');

export const TS_CONFIG_PATH = path.join(ROOT_PATH, 'tsconfig.json');
