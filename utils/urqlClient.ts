import {
    cacheExchange,
    createClient,
    fetchExchange,
} from 'urql';

import {
    gqlEndpoint,
    referrerEndpoint,
} from '@/constants/common';

import { getCsrfToken } from './csrfToken';

// Custom fetch function to inject CSRF token
const csrfFetch: typeof fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
) => {
    const csrfToken = await getCsrfToken();

    return fetch(input, {
        ...init,
        credentials: 'include', // send cookies
        headers: {
            ...(init?.headers ?? {}),
            'X-CSRFToken': csrfToken ?? '',
            Referer: referrerEndpoint,
        },
    });
};

// Create URQL client
const client = createClient({
    url: gqlEndpoint,
    exchanges: [cacheExchange, fetchExchange],
    fetch: csrfFetch,
});

export default client;
