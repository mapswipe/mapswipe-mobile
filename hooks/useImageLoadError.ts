import {
    useCallback,
    useState,
} from 'react';

interface ImageErrorEvent {
    nativeEvent?: { error?: unknown };
    error?: unknown;
}

function getErrorMessage(event: ImageErrorEvent | undefined) {
    const raw = event?.nativeEvent?.error ?? event?.error;
    if (typeof raw === 'string') {
        return raw;
    }
    if (raw instanceof Error) {
        return raw.message;
    }
    return raw === undefined ? 'Unknown error' : JSON.stringify(raw);
}

export default function useImageLoadError(url: string | undefined, label = 'image') {
    const [failure, setFailure] = useState<{ url: string | undefined; message: string }>();
    const [retryKey, setRetryKey] = useState(0);

    const failed = failure !== undefined && failure.url === url;

    const onError = useCallback((event?: ImageErrorEvent) => {
        const message = getErrorMessage(event);
        // eslint-disable-next-line no-console
        console.warn(`[${label}] failed to load ${url ?? '<no url>'}: ${message}`);
        setFailure({ url, message });
    }, [url, label]);

    const onLoad = useCallback(() => {
        setFailure(undefined);
    }, []);

    const retry = useCallback(() => {
        setFailure(undefined);
        setRetryKey((key) => key + 1);
    }, []);

    return {
        failed,
        errorMessage: failed ? failure.message : undefined,
        retryKey,
        onError,
        onLoad,
        retry,
    };
}
