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

const csrfFetch: typeof fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
) => {
    const csrfToken = await getCsrfToken();

    return fetch(input, {
        ...init,
        credentials: 'include',
        headers: {
            ...(init?.headers ?? {}),
            'X-CSRFToken': csrfToken ?? '',
            Referer: referrerEndpoint ?? '',
        },
    });
};

const client = createClient({
    url: gqlEndpoint,
    exchanges: [cacheExchange, fetchExchange],
    fetch: csrfFetch,
});

export default client;
