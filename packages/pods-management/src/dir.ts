import fs from 'fs';

export const ensureDirectoryAsync = (path: string) => {
    return fs.promises.mkdir(path, { recursive: true });
};
