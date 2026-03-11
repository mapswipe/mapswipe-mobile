import {
    caseInsensitiveSubmatch,
    compareStringSearch,
    isFalsyString,
} from '@togglecorp/fujs';
import {
    equalTo,
    get,
    orderByChild,
    query,
    ref,
} from 'firebase/database';

import { showAlert } from '@/components/Toast';

import { firebaseDatabase } from './firebase';

export const MIN_USERNAME_LENGTH = 4;

export function getProjectProgressForDisplay(progress: number): string {
    let finalProgress: string;

    if (progress < 99) {
        finalProgress = Math.max(0, progress).toFixed(0);
    } else if (progress < 100) {
        finalProgress = '99';
    } else {
        finalProgress = '100';
    }
    return finalProgress;
}

export function validateUserName(name: string | undefined) {
    if (!name || name.length < MIN_USERNAME_LENGTH) {
        return false;
    }

    // NOTE: this validation mirror is also used in firebase function
    // python-mapswipe-workers/firebase/functions/src/utils/index.ts
    const removeUserNameSpace = name.replace(/\s+/g, '');
    const newUserName = removeUserNameSpace.toLowerCase();

    return newUserName === name;
}

export function rankedSearchOnList<T>(
    list: T[],
    searchString: string,
    labelSelector: (item: T) => string,
): T[] {
    if (isFalsyString(searchString)) {
        return list;
    }

    return list
        .filter((option) => caseInsensitiveSubmatch(labelSelector(option), searchString))
        .sort((a, b) => compareStringSearch(labelSelector(a), labelSelector(b), searchString));
}

export async function usernameExists(username: string) {
    try {
        const q = query(
            ref(firebaseDatabase, 'v2/users'),
            orderByChild('usernameKey'),
            equalTo(username),
        );

        const snap = await get(q);
        return snap.exists();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        // eslint-disable-next-line no-console
        console.error('Error checking username:', error);

        showAlert({
            title: 'Error',
            message: error?.message || 'Failed to check username',
            alertType: 'error',
        });
        throw error;
    }
}
