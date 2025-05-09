#!/usr/bin/env node

import path from 'path';
import { maybePromptToSyncPodsAsync } from '../src/prepublish-checks';

(async () => {
    const argPath = process.argv[2]; // get 1st CLI argument (e.g., `.` or a path)
    const projectRoot = argPath ? path.resolve(argPath) : process.cwd();

    try {
        await maybePromptToSyncPodsAsync(projectRoot);
    } catch (err) {
        console.error('❌ Failed to sync CocoaPods:', err);
        process.exit(1);
    }
})();
