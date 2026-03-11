import {
    useCallback,
    useState,
} from 'react';
import {
    push,
    ref,
    set,
    update,
} from 'firebase/database';

import { firebaseDatabase } from '@/utils/firebase';

interface MutationOptions {
  path?: string;
  method?: 'update' | 'set' | 'push';
}

export default function useFirebaseMutation<TVariables = unknown>(
    options?: MutationOptions,
) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const mutate = useCallback(
        async (
            variables: TVariables,
            customTask?: (vars: TVariables) => Promise<unknown>,
        ): Promise<unknown> => {
            setIsLoading(true);
            setError(null);

            try {
                // Custom task
                if (customTask) {
                    const result = await customTask(variables);
                    setIsLoading(false);
                    return result;
                }

                if (!options?.path) {
                    throw new Error('No path or task provided');
                }

                const dbRef = ref(firebaseDatabase, options.path);

                if (options.method === 'push') {
                    const newRef = push(dbRef);
                    await set(newRef, variables);
                    setIsLoading(false);
                    return newRef.key;
                }

                if (options.method === 'set') {
                    await set(dbRef, variables);
                } else {
                    await update(dbRef, variables as Record<string, unknown>);
                }

                setIsLoading(false);
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error occurred';

                setError(message);
                setIsLoading(false);
                throw err;
            }
        },
        [options],
    );

    return { mutate, isLoading, error };
}
