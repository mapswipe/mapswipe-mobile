import { useColorScheme } from 'react-native';

import { getThemeColors } from '@/constants/theme';

function useTheme() {
    const scheme = useColorScheme();

    return getThemeColors(scheme ?? 'light');
}

export default useTheme;
