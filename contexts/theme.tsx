import {
    createContext,
    useMemo,
} from 'react';

import {
    type AppTheme,
    getThemeColors,
} from '@/constants/theme';

export type ColorScheme = 'light' | 'dark';

// Pinned to light on purpose: reading useColorScheme would flip the app to the unadopted
// dark palette.
export const DEFAULT_COLOR_SCHEME: ColorScheme = 'light';

export interface ThemeContextProps {
    colorScheme: ColorScheme;
    theme: AppTheme;
}

const ThemeContext = createContext<ThemeContextProps>({
    colorScheme: DEFAULT_COLOR_SCHEME,
    theme: getThemeColors(DEFAULT_COLOR_SCHEME),
});

interface Props {
    colorScheme?: ColorScheme;
    children?: React.ReactNode;
}

export function ThemeProvider(props: Props) {
    const {
        colorScheme = DEFAULT_COLOR_SCHEME,
        children,
    } = props;

    const value = useMemo<ThemeContextProps>(
        () => ({
            colorScheme,
            theme: getThemeColors(colorScheme),
        }),
        [colorScheme],
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeContext;
