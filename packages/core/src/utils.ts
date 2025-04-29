/**
 * Encodes a cookie value, optionally skipping JSON encoding.
 * @param value - The value to encode.
 * @param raw - If true, skips JSON encoding.
 * @returns The encoded string.
 */
export function encodeCookieValue(value: unknown, raw?: boolean): string {
    if (raw && typeof value === 'string') {
        return value;
    }

    if (!raw && (typeof value === 'string' || typeof value === 'number')) {
        return encodeURIComponent(String(value));
    }

    return encodeURIComponent(JSON.stringify(value));
}

/**
 * Decodes a cookie value, optionally skipping JSON decoding.
 * @param value - The encoded cookie value.
 * @param raw - If true, skips JSON decoding.
 * @param onError - Optional callback function called when decoding fails.
 * @returns The decoded value of type T. If decoding fails and raw is false, returns the original value cast to T.
 * @template T - The expected type of the decoded value.
 */
export function decodeCookieValue<T>(value: string, raw?: boolean, onError?: (err: unknown, value: string) => void): T {
    try {
        return raw ? (value as unknown as T) : JSON.parse(decodeURIComponent(value));
    } catch (err) {
        onError?.(err, value);
        return value as unknown as T;
    }
}
