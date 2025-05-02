import { decodeCookieValue, encodeCookieValue } from './utils';

/**
 * Indicates whether the current environment is in development mode.
 */
const __DEV__ = typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production';

/**
 * Maximum cookie size in bytes.
 *  - 4KB in most other browsers
 */
const MAX_COOKIE_SIZE = 4096;

/**
 * Regular expression to match reserved characters in cookie names.
 */
const RESERVED_CHARS_REGEX = /[()<>@,;:\\"[\]?={} \t]/g;

/**
 * Options for setting a cookie.
 */
export interface CookieOptions {
    /**
     * Cookie path. Defaults to "/".
     */
    path?: string;

    /**
     * Cookie expiration. Can be a number (days) or a Date.
     */
    expires?: number | Date;

    /**
     * The unit of time for the expires option.
     * - 'minutes': Expiration time in minutes
     * - 'hours': Expiration time in hours
     * - 'days': Expiration time in days (default)
     */
    expireUnit?: 'minutes' | 'days' | 'hours';

    /**
     * Whether the cookie is marked as secure.
     */
    secure?: boolean;

    /**
     * SameSite attribute for the cookie.
     */
    sameSite?: 'Lax' | 'Strict' | 'None';

    /**
     * If true, disables JSON encoding/decoding of the value.
     */
    raw?: boolean;

    /**
     * The domain attribute of the cookie.
     * If specified, the cookie will be available on the specified domain and all its subdomains.
     * If omitted, the cookie will only be available on the current domain.
     * @example
     * // Make cookie available on example.com and all subdomains
     * domain: 'example.com'
     *
     * // Make cookie available only on current domain
     * domain: undefined
     */
    domain?: string;
}

/**
 * Safely retrieves `document.cookie`, returning an empty string in non-browser environments.
 * @returns The cookie string or an empty string.
 */
function getSafeDocumentCookie(): string {
    if (typeof document === 'undefined') {
        console.warn('[cookies-core] Attempted to access document.cookie in non-browser environment');
        return '';
    }
    return document.cookie;
}

/**
 * Validates a cookie name for illegal characters.
 * @param name - The cookie name.
 * @throws Error if the name contains invalid characters.
 */
function validateCookieName(name: string): void {
    if (RESERVED_CHARS_REGEX.test(name)) {
        throw new Error(`[cookies-core] Cookie name "${name}" contains invalid characters.`);
    }
}

/**
 * Validates that a cookie value is of a supported type.
 * @param value - The cookie value to validate.
 * @throws Error if the value is a function, symbol, or undefined which cannot be stored in cookies.
 */
function validateCookieValue(value: unknown): void {
    if (typeof value === 'function' || typeof value === 'symbol' || typeof value === 'undefined') {
        throw new Error(`[cookies-core] Unsupported value type for cookie: ${typeof value}`);
    }
}
/**
 * Validates cookie configuration and warns about potential issues in development.
 * @param cookieString - The complete cookie string to be set
 * @param name - The name of the cookie
 * @param options - Cookie configuration options
 */
function validateCookieConfiguration(cookieString: string, name: string, options: CookieOptions): void {
    if (!__DEV__) return;

    if (name.startsWith('__Host-')) {
        if (options.domain) {
            console.warn(`[cookies-core] "__Host-" prefix cookies must not set a domain.`);
        }
        if ((options.path || '/') !== '/') {
            console.warn(`[cookies-core] "__Host-" prefix cookies must have path="/".`);
        }
        if (!options.secure) {
            console.warn(`[cookies-core] "__Host-" prefix cookies must be Secure.`);
        }
    }

    if (name.startsWith('__Secure-') && !options.secure) {
        console.warn(`[cookies-core] "__Secure-" prefix cookies must be Secure.`);
    }

    if (cookieString.length > MAX_COOKIE_SIZE) {
        console.warn(`[cookies-core] Cookie "${name}" exceeds size limit (${cookieString.length}/4096)`);
    }

    if (options.sameSite === 'None' && !options.secure) {
        console.warn(`[cookies-core] SameSite=None requires 'Secure' flag`);
    }
}

/**
 * Sets a cookie with the given name, value, and options.
 * @param name - The name of the cookie.
 * @param value - The value to store.
 * @param options - Optional settings like path, expiry, secure, etc.
 */
function setCookie<T>(name: string, value: T, options: CookieOptions = {}): void {
    if (typeof document === 'undefined') {
        return;
    }

    validateCookieName(name);
    validateCookieValue(value);

    const encodedValue = encodeCookieValue(value, options.raw);

    const parts = [
        `${encodeURIComponent(name)}=${encodedValue}`,
        `Path=${options.path || '/'}`,
        `SameSite=${options.sameSite || 'Lax'}`,
    ];

    if (options.expires) {
        const unit = options.expireUnit || 'days';
        const multiplier = unit === 'minutes' ? 1000 * 60 : unit === 'hours' ? 3600000 : 86400000;
        const expires =
            options.expires instanceof Date ? options.expires : new Date(Date.now() + options.expires * multiplier);

        parts.push(`Expires=${expires.toString()}`);
    }

    if (options.secure || options.sameSite === 'None') {
        parts.push('Secure');
    }

    if (options.domain) {
        parts.push(`Domain=${options.domain}`);
    }

    const cookieString = parts.join('; ');

    validateCookieConfiguration(cookieString, name, options);

    document.cookie = cookieString;
}

/**
 * Retrieves the value of a specific cookie.
 * @param name - The name of the cookie to retrieve.
 * @param options - If `raw` is true, skips JSON decoding.
 * @returns The parsed cookie value or `undefined` if not found.
 */
function getCookie<T = unknown>(name: string, options: { raw?: boolean } = {}): T | undefined {
    const allCookies = getAllCookies<T>(options);
    return allCookies?.[name];
}

/**
 * Retrieves all cookies as a key-value map.
 * @param options - If `raw` is true, skips JSON decoding.
 * @returns A record of all cookies.
 */
function getAllCookies<T = unknown>(options: { raw?: boolean } = {}): Record<string, T> {
    const documentCookie = getSafeDocumentCookie();

    const cookies = documentCookie ? documentCookie.split('; ') : [];

    const jar: Record<string, T> = {};

    for (const cookie of cookies) {
        const [encodedKey, ...rest] = cookie.split('=');
        const key = decodeURIComponent((encodedKey || '').trim());
        const value = rest.join('=');

        jar[key] = decodeCookieValue<T>(value, options.raw, (err, val) => {
            if (__DEV__) {
                console.warn(`[cookies-core] Failed to decode cookie "${key}":`, err, val);
            }
        });
    }

    return jar;
}

/**
 * Deletes a cookie by setting its expiration date in the past.
 * @param name - The name of the cookie.
 * @param path - The path of the cookie. Defaults to '/'.
 */
function deleteCookie(name: string, path = '/'): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.cookie = `${encodeURIComponent(name)}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export { deleteCookie, getAllCookies, getCookie, setCookie };
