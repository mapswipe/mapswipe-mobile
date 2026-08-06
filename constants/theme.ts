export type AppTheme = {
  brand: string;
  positive: string;
  negative: string;
  accent: string;

  background: string;
  backgroundBrand: string;
  backgroundMuted: string;
  backgroundTrack: string;
  inputBrandBackground: string;
  card: string;
  border: string;
  divider: string;

  surfaceOnBrand: string;
  surfaceOnBrandStrong: string;
  borderOnBrand: string;
  dividerOnBrand: string;

  surfaceInverse: string;
  pillSurface: string;
  pillSurfaceInverse: string;
  trackOnImage: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  textOnSecondary: string;
  textOnBrand: string;
  textOnImage: string;

  // Ordered by strength. `overlay` is an alias of `scrim`, so keep the two values in sync.
  scrim: string;
  scrimSoft: string;
  scrimMedium: string;
  scrimStrong: string;
  scrimModal: string;
  overlay: string;

  shadowColor: string;

  success: string;
  successSurface: string;
  successText: string;
  warning: string;
  warningText: string;
  error: string;
  errorText: string;
  info: string;

  mapSelection: string;
  mapUncertain: string;
  mapRejected: string;
  mapBoundary: string;
  mapFeatureLine: string;

  gridLine: string;
  gridLineMuted: string;
  tileOverlay: string;
  selectionRing: string;

  heatMapDayColor1: string;
  heatMapDayColor2: string;
  heatMapDayColor3: string;
  heatMapDayColor4: string;

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
    brand: '#0D1949',
    positive: '#32A929',
    negative: '#E61C1C',
    accent: '#E5484D',
    background: '#F8FAFC',
    backgroundBrand: '#0D1949',
    backgroundMuted: '#F1F5F9',
    backgroundTrack: '#3e466d',
    inputBrandBackground: '#3e466d',
    card: '#FFFFFF',
    border: '#E2E8F0',
    divider: '#E2E8F0',
    surfaceOnBrand: 'rgba(255, 255, 255, 0.05)',
    surfaceOnBrandStrong: 'rgba(255, 255, 255, 0.85)',
    borderOnBrand: 'rgba(255, 255, 255, 0.12)',
    dividerOnBrand: 'rgba(255, 255, 255, 0.15)',
    surfaceInverse: '#212121',
    pillSurface: 'rgba(255, 255, 255, 0.84)',
    pillSurfaceInverse: 'rgba(60, 60, 67, 0.75)',
    trackOnImage: 'rgba(255, 255, 255, 0.3)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#94A3B8',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textOnBrand: '#FFFFFF',
    textOnImage: 'rgba(255, 255, 255, 0.92)',
    scrim: 'rgba(17, 24, 39, 0.45)',
    scrimSoft: 'rgba(52, 52, 52, 0.5)',
    scrimMedium: 'rgba(52, 52, 52, 0.7)',
    scrimStrong: 'rgba(0, 0, 0, 0.78)',
    scrimModal: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(17, 24, 39, 0.45)',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    success: '#32A929',
    successSurface: 'rgba(50, 169, 41, 0.18)',
    successText: '#FFFFFF',
    warning: '#F59E0B',
    warningText: '#0F172A',
    error: '#E61C1C',
    errorText: '#FFFFFF',
    info: '#2563EB',
    mapSelection: '#22C55E',
    mapUncertain: '#3B82F6',
    mapRejected: '#EF4444',
    mapBoundary: '#9CA3AF',
    mapFeatureLine: '#ffffff',
    gridLine: 'rgba(255, 255, 255, 1)',
    gridLineMuted: 'rgba(255, 255, 255, 0.5)',
    tileOverlay: 'rgba(255, 255, 255, 0.2)',
    selectionRing: '#FFFFFF',
    heatMapDayColor1: '#d6e685',
    heatMapDayColor2: '#8cc665',
    heatMapDayColor3: '#44a340',
    heatMapDayColor4: '#1e6823',
    projectCardGradients: PROJECT_CARD_GRADIENTS,
};

export const darkTheme: AppTheme = {
    brand: '#0D1949',
    positive: '#32A929',
    negative: '#E61C1C',
    accent: '#E5484D',
    background: '#020617',
    backgroundBrand: '#0D1949',
    backgroundMuted: '#1E293B',
    backgroundTrack: '#3e466d',
    inputBrandBackground: '#3e466d',
    card: '#0F172A',
    border: '#1E293B',
    divider: '#1E293B',
    // Shared with lightTheme on purpose: these sit over imagery or the brand navy, not the page.
    surfaceOnBrand: 'rgba(255, 255, 255, 0.05)',
    surfaceOnBrandStrong: 'rgba(255, 255, 255, 0.85)',
    borderOnBrand: 'rgba(255, 255, 255, 0.12)',
    dividerOnBrand: 'rgba(255, 255, 255, 0.15)',
    surfaceInverse: '#212121',
    pillSurface: 'rgba(255, 255, 255, 0.84)',
    pillSurfaceInverse: 'rgba(60, 60, 67, 0.75)',
    trackOnImage: 'rgba(255, 255, 255, 0.3)',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5F5',
    textMuted: '#64748B',
    textOnPrimary: '#FFFFFF',
    textOnSecondary: '#FFFFFF',
    textOnBrand: '#FFFFFF',
    textOnImage: 'rgba(255, 255, 255, 0.92)',
    scrim: 'rgba(17, 24, 39, 0.45)',
    scrimSoft: 'rgba(52, 52, 52, 0.5)',
    scrimMedium: 'rgba(52, 52, 52, 0.7)',
    scrimStrong: 'rgba(0, 0, 0, 0.78)',
    scrimModal: 'rgba(0, 0, 0, 0.2)',
    overlay: 'rgba(17, 24, 39, 0.45)',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    success: '#32A929',
    successSurface: 'rgba(50, 169, 41, 0.18)',
    successText: '#052E16',
    warning: '#FBBF24',
    warningText: '#422006',
    error: '#E61C1C',
    errorText: '#450A0A',
    info: '#3B82F6',
    mapSelection: '#22C55E',
    mapUncertain: '#3B82F6',
    mapRejected: '#EF4444',
    mapBoundary: '#9CA3AF',
    mapFeatureLine: '#ffffff',
    gridLine: 'rgba(255, 255, 255, 1)',
    gridLineMuted: 'rgba(255, 255, 255, 0.5)',
    tileOverlay: 'rgba(255, 255, 255, 0.2)',
    selectionRing: '#FFFFFF',
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

/** AppTheme keys holding a colour string, so projectCardGradients cannot pass as a colour. */
export type ThemeColorKey = {
    [K in keyof AppTheme]: AppTheme[K] extends string ? K : never;
}[keyof AppTheme];

export interface ColorRole {
    content: ThemeColorKey;
    surface: ThemeColorKey;
    /** A foreground guaranteed legible on `surface`. */
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
