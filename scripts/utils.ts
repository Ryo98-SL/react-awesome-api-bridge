import path from 'path';
import url from 'url';

/**
 * Returns the full path of the root directory of this repository.
 */
export function getWorkspaceRoot() {
    const currentDirectory = url.fileURLToPath(new URL('.', import.meta.url));
    const workspaceRoot = path.resolve(currentDirectory, '..');
    return workspaceRoot;
}
