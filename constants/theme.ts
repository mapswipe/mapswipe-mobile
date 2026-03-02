export type AppTheme = {
    // Brand
    primaryBlue: string;
    primaryGreen: string;
    primaryRed: string;

    // Surfaces
    background: string;
    backgroundBrand: string;
    backgroundMuted: string;
    inputBrandBackground: string;
    card: string;
    border: string;
    divider: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textOnPrimary: string;
    textOnSecondary: string;
    textOnBrand: string;

    // Feedback
    success: string;
    successText: string;
    warning: string;
    warningText: string;
    error: string;
    errorText: string;
    info: string;

    // MapSwipe-specific states
    mapSelection: string;
    mapUncertain: string;
    mapRejected: string;
    mapBoundary: string;
    // Misc
    overlay: string;
};

export const lightTheme: AppTheme = {
    // Brand
    primaryBlue: '#0D1949',
    primaryGreen: '#32A929',
    primaryRed: '#E61C1C',
    // Surfaces
    background: '#F8FAFC',
    backgroundBrand: '#0D1949',
    backgroundMuted: '#F1F5F9',
    inputBrandBackground: '#3e466d',
    card: '#FFFFFF',
    border: '#E2E8F0',
    divider: '#E2E8F0',
    // Text
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textOnBrand: '#FFFFFF',
    // Feedback
    success: '#32A929',
    successText: '#FFFFFF',
    warning: '#F59E0B',
    warningText: '#0F172A',
    error: '#E61C1C',
    errorText: '#FFFFFF',
    info: '#2563EB',
    // MapSwipe-specific states
    mapSelection: '#22C55E',
    mapUncertain: '#3B82F6',
    mapRejected: '#EF4444',
    mapBoundary: '#9CA3AF',
    // Misc
    overlay: 'rgba(17, 24, 39, 0.45)',
};

export const darkTheme: AppTheme = {
    // Brand
    primaryBlue: '#0D1949',
    primaryGreen: '#32A929',
    primaryRed: '#E61C1C',
    // Surfaces
    background: '#020617',
    backgroundBrand: '#0D1949',
    backgroundMuted: '#1E293B',
    inputBrandBackground: '#3e466d',
    card: '#0F172A',
    border: '#1E293B',
    divider: '#1E293B',
    // Text
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5F5',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textOnBrand: '#FFFFFF',
    // Feedback
    success: '#32A929',
    successText: '#052E16',
    warning: '#FBBF24',
    warningText: '#422006',
    error: '#E61C1C',
    errorText: '#450A0A',
    info: '#3B82F6',
    // MapSwipe-specific states
    mapSelection: '#22C55E',
    mapUncertain: '#3B82F6',
    mapRejected: '#EF4444',
    mapBoundary: '#9CA3AF',
    // Misc
    overlay: 'rgba(17, 24, 39, 0.45)',
};

export function getThemeColors(colorScheme: 'light' | 'dark' = 'light') {
    if (colorScheme === 'dark') {
        return darkTheme;
    }

    return lightTheme;
}
