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

type DurationNumeric = 0 | 1 | 2 | 3 | 4 | 5;

const mappings: Record<
  DurationNumeric,
  { text: string; shortText: string; value: number }
> = {
    0: { text: 'year', shortText: 'yr', value: 365 * 24 * 60 * 60 },
    1: { text: 'month', shortText: 'mo', value: 30 * 24 * 60 * 60 },
    2: { text: 'day', shortText: 'day', value: 24 * 60 * 60 },
    3: { text: 'hour', shortText: 'hr', value: 60 * 60 },
    4: { text: 'minute', shortText: 'min', value: 60 },
    5: { text: 'second', shortText: 'sec', value: 1 },
};

export function getTimeSegments(
    seconds: number,
    separator: string = ' ',
    shorten: boolean = true,
    stop: number = 2,
    currentState: DurationNumeric = 0,
    lastState?: number,
): { value: number; unit: string }[] {
    if (lastState !== undefined && currentState >= lastState) {
        return [];
    }

    const map = mappings[currentState];

    if (currentState === 5) {
        return [
            {
                value: seconds,
                unit: shorten ? map.shortText : map.text,
            },
        ];
    }

    const dur = Math.floor(seconds / map.value);

    const nextState = (currentState + 1) as DurationNumeric;

    if (dur >= 1) {
        return [
            {
                value: dur,
                unit: shorten ? map.shortText : map.text,
            },
            ...getTimeSegments(
                seconds % map.value,
                separator,
                shorten,
                stop,
                nextState,
                lastState ?? currentState + stop,
            ),
        ];
    }

    return getTimeSegments(
        seconds,
        separator,
        shorten,
        stop,
        nextState,
        lastState,
    );
}
