import {
    useCallback,
    useMemo,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import { set } from 'firebase/database';

import { firebaseRef } from '@/utils/firebase';

import useAuth from './useAuth';
import useFirebaseDatabase from './useFirebaseDatabase';

// The Firebase path stays `accessibility` despite the hook name: renaming orphans saved values.
function useAnswerBadgesEnabled() {
    const { user } = useAuth();
    const userId = user?.uid;

    const answerBadgesQuery = useMemo(() => (
        userId ? firebaseRef(`v2/users/${userId}/accessibility`) : undefined
    ), [userId]);

    const { data: answerBadgesEnabled, pending } = useFirebaseDatabase<boolean>({
        query: answerBadgesQuery,
        skip: isNotDefined(userId),
    });

    const setAnswerBadgesEnabled = useCallback(async (value: boolean) => {
        if (isNotDefined(userId)) {
            throw new Error('User not authenticated');
        }
        await set(firebaseRef(`v2/users/${userId}/accessibility`), value);
    }, [userId]);

    return {
        isAnswerBadgesEnabled: answerBadgesEnabled ?? false,
        pending,
        setAnswerBadgesEnabled,
    };
}

export default useAnswerBadgesEnabled;
