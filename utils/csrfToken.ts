import AsyncStorage from '@react-native-async-storage/async-storage';

import { healthCheckEndpoint } from '@/constants/common';

const CSRF_COOKIE_NAME_KEY = 'csrf_cookie_name';
const CSRF_KEY = 'csrf_token';

export async function fetchCsrfToken() {
    try {
        const response = await fetch(healthCheckEndpoint, {
            method: 'GET',
            credentials: 'include',
        });
        if (!response.ok) {
            return null;
        }

        // The CSRF cookie is readable from different places per platform:
        // - Native (React Native): `Set-Cookie` IS exposed on the response
        //   headers (RN doesn't apply the browser's forbidden-header rule),
        //   but there is no `document`.
        // - Web (browser): `Set-Cookie` is a forbidden response header (returns
        //   null), but the browser stores the (non-HttpOnly) cookie and exposes
        //   it via `document.cookie`.
        // Try both so it works on web and native.
        const setCookieHeader = response.headers.get('set-cookie');
        const documentCookie = typeof document !== 'undefined' ? document.cookie : '';
        const cookieString = setCookieHeader || documentCookie;

        const match = cookieString.match(/(MAPSWIPE-[\w-]+-CSRFTOKEN)=([^;]+)/);
        if (match) {
            const [, cookieName, csrfToken] = match;
            await AsyncStorage.setItem(CSRF_COOKIE_NAME_KEY, cookieName);
            await AsyncStorage.setItem(CSRF_KEY, csrfToken);
            return csrfToken;
        }
        return null;
    } catch (err) {
        // A failed CSRF fetch is expected and recoverable (offline, backend
        // unreachable). Warn instead of error so it does not raise a red-box
        // LogBox in dev.
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch CSRF token', err);
        return null;
    }
}

export async function getCsrfToken() {
    return AsyncStorage.getItem(CSRF_KEY);
}

export async function getCsrfCookieName() {
    return AsyncStorage.getItem(CSRF_COOKIE_NAME_KEY);
}
