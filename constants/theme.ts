type AppTheme = {
    // Brand
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;

    // UI surfaces
    background: string;
    surface: string;
    surfaceMuted: string;
    card: string;
    border: string;
    divider: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textOnPrimary: string;
    textOnSecondary: string;

    // Feedback
    success: string;
    warning: string;
    error: string;
    info: string;

    // MapSwipe-specific states
    mapSelection: string;
    mapUncertain: string;
    mapRejected: string;
    mapBoundary: string;

    // Misc
    overlay: string; // for modals / scrims
};

export const lightTheme: AppTheme = {
    // Brand
    primary: "#23085A",
    primaryLight: "#4A2B8C",
    primaryDark: "#17003D",
    secondary: "#F59E0B",
    secondaryLight: "#FCD34D",
    secondaryDark: "#B45309",

    // UI surfaces
    background: "#F9FAFB",
    surface: "#FFFFFF",
    surfaceMuted: "#F3F4F6",
    card: "#FFFFFF",
    border: "#E5E7EB",
    divider: "#E5E7EB",

    // Text
    textPrimary: "#111827",
    textSecondary: "#4B5563",
    textMuted: "#9CA3AF",
    textOnPrimary: "#FFFFFF",
    textOnSecondary: "#111827",

    // Feedback
    success: "#16A34A",
    warning: "#F59E0B",
    error: "#DC2626",
    info: "#2563EB",

    // MapSwipe-specific states
    mapSelection: "#22C55E",
    mapUncertain: "#3B82F6",
    mapRejected: "#EF4444",
    mapBoundary: "#9CA3AF",

    // Misc
    overlay: "rgba(17, 24, 39, 0.45)", // slate-900-ish
};

export const darkTheme: AppTheme = {
    // Brand (keep consistent)
    primary: "#9F7AEA",      // Brighter indigo for dark surfaces (accessible)
    primaryLight: "#C4B5FD",
    primaryDark: "#6D28D9",
    secondary: "#FBBF24",    // Amber tuned for dark mode
    secondaryLight: "#FDE68A",
    secondaryDark: "#D97706",

    // UI surfaces
    background: "#0B1220",
    surface: "#121B2E",
    surfaceMuted: "#18233A",
    card: "#121B2E",
    border: "#26334D",
    divider: "#26334D",

    // Text
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#94A3B8",
    textOnPrimary: "#0B1220",
    textOnSecondary: "#0B1220",

    // Feedback (slightly brighter for dark)
    success: "#22C55E",
    warning: "#FBBF24",
    error: "#F87171",
    info: "#60A5FA",

    // MapSwipe-specific states (ensure pop on satellite imagery)
    mapSelection: "#34D399",
    mapUncertain: "#60A5FA",
    mapRejected: "#FB7185",
    mapBoundary: "#94A3B8",

    // Misc
    overlay: "rgba(2, 6, 23, 0.65)", // near-slate-950
};

export function getThemeColors(colorScheme: 'light' | 'dark' = 'light') {
    if (colorScheme === 'dark') {
        return darkTheme;
    }

    return lightTheme;
}
