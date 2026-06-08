import {
    useCallback,
    useMemo,
} from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import { set } from 'firebase/database';

import { firebaseRef } from '@/utils/firebase';

import useAuth from './useAuth';
import useFirebaseDatabase from './useFirebaseDatabase';

function useAccessibility() {
    const { user } = useAuth();
    const userId = user?.uid;

    const accessibilityQuery = useMemo(() => (
        userId ? firebaseRef(`v2/users/${userId}/accessibility`) : undefined
    ), [userId]);

    const { data: accessibilityEnabled, pending } = useFirebaseDatabase<boolean>({
        query: accessibilityQuery,
        skip: isNotDefined(userId),
    });

    const setAccessibility = useCallback(async (value: boolean) => {
        if (isNotDefined(userId)) {
            throw new Error('User not authenticated');
        }
        await set(firebaseRef(`v2/users/${userId}/accessibility`), value);
    }, [userId]);

    return {
        isAccessibilityEnabled: accessibilityEnabled ?? false,
        pending,
        setAccessibility,
    };
}

export default useAccessibility;
