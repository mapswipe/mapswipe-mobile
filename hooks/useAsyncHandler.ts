import {
    useCallback,
    useState,
} from 'react';

export default function useAsyncHandler() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleAsync = useCallback(
        async <T>(task: () => Promise<T>): Promise<T> => {
            setLoading(true);
            setError(null);

            try {
                const result = await task();
                setLoading(false);
                return result;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error occurred';
                setError(message);
                setLoading(false);
                throw err;
            }
        },
        [],
    );

    return { handleAsync, loading, error };
}
