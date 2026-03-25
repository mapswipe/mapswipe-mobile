import {
    useCallback,
    useState,
} from 'react';

export default function useAsyncHandler() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleAsync = useCallback(
        async <T>(task: () => Promise<T>): Promise<T> => {
            setIsLoading(true);
            setError(null);

            try {
                const result = await task();
                setIsLoading(false);
                return result;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error occurred';
                setError(message);
                setIsLoading(false);
                throw err;
            }
        },
        [],
    );

    return { handleAsync, isLoading, error };
}
