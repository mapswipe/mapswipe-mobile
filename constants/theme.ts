export type AppTheme = {
  // Brand
  primaryBlue: string;
  primaryGreen: string;
  primaryRed: string;

  // Role aliases for the three brand colours above. Prefer these: they say what the colour
  // is for rather than what it looks like, so a rebrand does not leave `primaryRed` green.
  brand: string;
  positive: string;
  negative: string;
  accent: string;

  // Surfaces
  background: string;
  backgroundBrand: string;
  backgroundMuted: string;
  backgroundTrack: string;
  inputBrandBackground: string;
  card: string;
  border: string;
  divider: string;

  // Surfaces layered on the brand background (session chrome)
  surfaceOnBrand: string;
  surfaceOnBrandStrong: string;
  borderOnBrand: string;
  dividerOnBrand: string;

  // Surfaces layered on imagery
  surfaceInverse: string;
  pillSurface: string;
  pillSurfaceInverse: string;
  trackOnImage: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnSecondary: string;
  textOnBrand: string;
  textOnImage: string;

  // Scrims, ordered by strength. `overlay` is the original name for `scrim`.
  scrim: string;
  scrimSoft: string;
  scrimMedium: string;
  scrimStrong: string;
  scrimModal: string;
  overlay: string;

  shadowColor: string;

  // Feedback
  success: string;
  successSurface: string;
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
  mapFeatureLine: string;

  // Tile and grid chrome
  gridLine: string;
  gridLineMuted: string;
  tileOverlay: string;
  selectionRing: string;

  // Accent
  accentRed: string;
  // Misc
  heatMapDayColor1: string;
  heatMapDayColor2: string;
  heatMapDayColor3: string;
  heatMapDayColor4: string;

  // Not a colour: the project card gradient pairs. Excluded from ThemeColorKey by construction.
  projectCardGradients: [string, string][];
};

const PROJECT_CARD_GRADIENTS: [string, string][] = [
    ['#9aa0ac', '#6f7686'],
    ['#8a9a8e', '#5f7267'],
    ['#a89f91', '#7d7566'],
    ['#8e99a4', '#5d6b7a'],
    ['#a0949a', '#756370'],
    ['#94a3b0', '#697a89'],
];

export const lightTheme: AppTheme = {
    // Brand
    primaryBlue: '#0D1949',
    primaryGreen: '#32A929',
    primaryRed: '#E61C1C',
    brand: '#0D1949',
    positive: '#32A929',
    negative: '#E61C1C',
    accent: '#E5484D',
    // Surfaces
    background: '#F8FAFC',
    backgroundBrand: '#0D1949',
    backgroundMuted: '#F1F5F9',
    backgroundTrack: '#3e466d',
    inputBrandBackground: '#3e466d',
    card: '#FFFFFF',
    border: '#E2E8F0',
    divider: '#E2E8F0',
    // Surfaces on brand
    surfaceOnBrand: 'rgba(255, 255, 255, 0.05)',
    surfaceOnBrandStrong: 'rgba(255, 255, 255, 0.85)',
    borderOnBrand: 'rgba(255, 255, 255, 0.12)',
    dividerOnBrand: 'rgba(255, 255, 255, 0.15)',
    // Surfaces on imagery
    surfaceInverse: '#212121',
    pillSurface: 'rgba(255, 255, 255, 0.84)',
    pillSurfaceInverse: 'rgba(60, 60, 67, 0.75)',
    trackOnImage: 'rgba(255, 255, 255, 0.3)',
    // Text
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textOnBrand: '#FFFFFF',
    textOnImage: 'rgba(255, 255, 255, 0.92)',
    // Scrims
    scrim: 'rgba(17, 24, 39, 0.45)',
    scrimSoft: 'rgba(52, 52, 52, 0.5)',
    scrimMedium: 'rgba(52, 52, 52, 0.7)',
    scrimStrong: 'rgba(0, 0, 0, 0.78)',
    scrimModal: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(17, 24, 39, 0.45)',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    // Feedback
    success: '#32A929',
    successSurface: 'rgba(50, 169, 41, 0.18)',
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
    mapFeatureLine: '#ffffff',
    // Tile and grid chrome
    gridLine: 'rgba(255, 255, 255, 1)',
    gridLineMuted: 'rgba(255, 255, 255, 0.5)',
    tileOverlay: 'rgba(255, 255, 255, 0.2)',
    selectionRing: '#FFFFFF',
    // Accent
    accentRed: '#E5484D',
    // Misc
    heatMapDayColor1: '#d6e685',
    heatMapDayColor2: '#8cc665',
    heatMapDayColor3: '#44a340',
    heatMapDayColor4: '#1e6823',
    projectCardGradients: PROJECT_CARD_GRADIENTS,
};

export const darkTheme: AppTheme = {
    // Brand
    primaryBlue: '#0D1949',
    primaryGreen: '#32A929',
    primaryRed: '#E61C1C',
    brand: '#0D1949',
    positive: '#32A929',
    negative: '#E61C1C',
    accent: '#E5484D',
    // Surfaces
    background: '#020617',
    backgroundBrand: '#0D1949',
    backgroundMuted: '#1E293B',
    backgroundTrack: '#3e466d',
    inputBrandBackground: '#3e466d',
    card: '#0F172A',
    border: '#1E293B',
    divider: '#1E293B',
    // Surfaces on brand: unchanged, they are translucent white over the same brand navy
    surfaceOnBrand: 'rgba(255, 255, 255, 0.05)',
    surfaceOnBrandStrong: 'rgba(255, 255, 255, 0.85)',
    borderOnBrand: 'rgba(255, 255, 255, 0.12)',
    dividerOnBrand: 'rgba(255, 255, 255, 0.15)',
    // Surfaces on imagery: also unchanged, imagery does not follow the theme
    surfaceInverse: '#212121',
    pillSurface: 'rgba(255, 255, 255, 0.84)',
    pillSurfaceInverse: 'rgba(60, 60, 67, 0.75)',
    trackOnImage: 'rgba(255, 255, 255, 0.3)',
    // Text
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5F5',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textOnBrand: '#FFFFFF',
    textOnImage: 'rgba(255, 255, 255, 0.92)',
    // Scrims: same over imagery, but a darker page needs a heavier shadow to read
    scrim: 'rgba(17, 24, 39, 0.45)',
    scrimSoft: 'rgba(52, 52, 52, 0.5)',
    scrimMedium: 'rgba(52, 52, 52, 0.7)',
    scrimStrong: 'rgba(0, 0, 0, 0.78)',
    scrimModal: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(17, 24, 39, 0.45)',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    // Feedback
    success: '#32A929',
    successSurface: 'rgba(50, 169, 41, 0.18)',
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
    mapFeatureLine: '#ffffff',
    // Tile and grid chrome
    gridLine: 'rgba(255, 255, 255, 1)',
    gridLineMuted: 'rgba(255, 255, 255, 0.5)',
    tileOverlay: 'rgba(255, 255, 255, 0.2)',
    selectionRing: '#FFFFFF',
    // Accent
    accentRed: '#E5484D',
    // Misc
    heatMapDayColor1: '#d6e685',
    heatMapDayColor2: '#8cc665',
    heatMapDayColor3: '#44a340',
    heatMapDayColor4: '#1e6823',
    projectCardGradients: PROJECT_CARD_GRADIENTS,
};

export function getThemeColors(colorScheme: 'light' | 'dark' = 'light') {
    if (colorScheme === 'dark') {
        return darkTheme;
    }

    return lightTheme;
}

/**
 * Every AppTheme key whose value is a colour string, so projectCardGradients cannot be
 * passed where a colour is expected.
 */
export type ThemeColorKey = {
    [K in keyof AppTheme]: AppTheme[K] extends string ? K : never;
}[keyof AppTheme];

export interface ColorRole {
    /** this colour used as a foreground */
    content: ThemeColorKey;
    /** this colour used as a background */
    surface: ThemeColorKey;
    /** a foreground guaranteed legible on `surface` */
    onSurface: ThemeColorKey;
    border: ThemeColorKey;
}

export const COLOR_ROLE = {
    default: {
        content: 'textPrimary',
        surface: 'card',
        onSurface: 'textPrimary',
        border: 'border',
    },
    secondary: {
        content: 'textSecondary',
        surface: 'backgroundMuted',
        onSurface: 'textSecondary',
        border: 'divider',
    },
    muted: {
        content: 'textMuted',
        surface: 'backgroundMuted',
        onSurface: 'textMuted',
        border: 'divider',
    },
    brand: {
        content: 'brand',
        surface: 'backgroundBrand',
        onSurface: 'textOnBrand',
        border: 'borderOnBrand',
    },
    onBrand: {
        content: 'textOnBrand',
        surface: 'surfaceOnBrand',
        onSurface: 'textOnBrand',
        border: 'borderOnBrand',
    },
    onImage: {
        content: 'textOnImage',
        surface: 'pillSurfaceInverse',
        onSurface: 'textOnImage',
        border: 'trackOnImage',
    },
    surface: {
        content: 'textPrimary',
        surface: 'card',
        onSurface: 'textPrimary',
        border: 'border',
    },
    sunken: {
        content: 'textSecondary',
        surface: 'backgroundMuted',
        onSurface: 'textSecondary',
        border: 'divider',
    },
    accent: {
        content: 'accent',
        surface: 'accent',
        onSurface: 'textOnPrimary',
        border: 'accent',
    },
    positive: {
        content: 'positive',
        surface: 'success',
        onSurface: 'successText',
        border: 'success',
    },
    notice: {
        content: 'warning',
        surface: 'warning',
        onSurface: 'warningText',
        border: 'warning',
    },
    negative: {
        content: 'negative',
        surface: 'error',
        onSurface: 'errorText',
        border: 'error',
    },
    informative: {
        content: 'info',
        surface: 'info',
        onSurface: 'textOnPrimary',
        border: 'info',
    },
} satisfies Record<string, ColorRole>;

export type ColorVariant = keyof typeof COLOR_ROLE;

export function resolveColor(
    theme: AppTheme,
    colorVariant: ColorVariant,
    slot: keyof ColorRole = 'content',
): string {
    return theme[COLOR_ROLE[colorVariant][slot]];
}
