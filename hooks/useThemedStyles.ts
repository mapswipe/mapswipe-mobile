import { useMemo } from 'react';

import { type AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';

function useThemedStyle<T, Q = void>(
    fn: (theme: AppTheme, opts: Q) => T,
    opts?: Q,
): T {
    const theme = useTheme();
    const themedStyle = useMemo(
        () => fn(theme, opts as Q),
        [fn, opts, theme],
    );
    return themedStyle;
}

export default useThemedStyle;
