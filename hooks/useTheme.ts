import { useContext } from 'react';

import { type AppTheme } from '@/constants/theme';
import ThemeContext from '@/contexts/theme';

function useTheme(): AppTheme {
    // No provider guard on purpose: ThemeContext carries a full default theme.
    const { theme } = useContext(ThemeContext);

    return theme;
}

export default useTheme;
