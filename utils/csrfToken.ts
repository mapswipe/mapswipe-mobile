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

        // Native exposes Set-Cookie on the response; web only has document.cookie. Try both.
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
        // console.error red-boxes in RN dev, and a failed CSRF fetch is recoverable.
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
