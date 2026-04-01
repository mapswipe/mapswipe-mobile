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
        if (response.ok) {
            const match = document.cookie.match(/(MAPSWIPE-[\w-]+-CSRFTOKEN)=([^;]+)/);
            if (match) {
                const cookieName = match[1];
                const csrfToken = match[2];
                await AsyncStorage.setItem(CSRF_COOKIE_NAME_KEY, cookieName);
                await AsyncStorage.setItem(CSRF_KEY, csrfToken);
                return csrfToken;
            }
        }
        return null;
    } catch (err) {
        console.error('Failed to fetch CSRF token', err);
        return null;
    }
}

export async function getCsrfToken() {
    return AsyncStorage.getItem(CSRF_KEY);
}

export async function getCsrfCookieName() {
    return AsyncStorage.getItem(CSRF_COOKIE_NAME_KEY);
}
