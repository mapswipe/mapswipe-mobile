import { getThemeColors } from "@/constants/theme";
import { useColorScheme } from "react-native";

function useTheme() {
    const scheme = useColorScheme();

    return getThemeColors(scheme ?? 'light');
}

export default useTheme;
