/** @returns `true` if the process is interactive. */
export function isInteractive(): boolean {
    return process.stdout.isTTY;
}
