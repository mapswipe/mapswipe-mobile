import { useColorScheme } from 'react-native';

import { getThemeColors } from '@/constants/theme';

function useTheme() {
    const scheme = useColorScheme();

    // FIXME: For now everything is light themed, let's change this after we fully
    // implement dark theme
    return getThemeColors((scheme !== 'light') ? 'light' : scheme);
}

export default useTheme;
