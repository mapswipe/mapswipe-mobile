import {
    useMemo,
    useRef,
} from 'react';

import { type AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';

// Callers pass a fresh object literal every render, so identity alone always misses the memo.
function isSameOpts(a: unknown, b: unknown): boolean {
    if (Object.is(a, b)) {
        return true;
    }
    if (
        typeof a !== 'object' || a === null
        || typeof b !== 'object' || b === null
    ) {
        return false;
    }
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) {
        return false;
    }
    const aRecord = a as Record<string, unknown>;
    const bRecord = b as Record<string, unknown>;
    return aKeys.every((key) => (
        Object.prototype.hasOwnProperty.call(b, key)
        && Object.is(aRecord[key], bRecord[key])
    ));
}

function useThemedStyle<T, Q = void>(
    fn: (theme: AppTheme, opts: Q) => T,
    opts?: Q,
): T {
    const theme = useTheme();

    // Safe during render: the ref only ever holds an `opts` equal to this render's.
    /* eslint-disable react-hooks/refs */
    const stableOptsRef = useRef(opts);
    if (!isSameOpts(stableOptsRef.current, opts)) {
        stableOptsRef.current = opts;
    }
    const stableOpts = stableOptsRef.current;
    /* eslint-enable react-hooks/refs */

    const themedStyle = useMemo(
        () => fn(theme, stableOpts as Q),
        [fn, stableOpts, theme],
    );
    return themedStyle;
}

export default useThemedStyle;
