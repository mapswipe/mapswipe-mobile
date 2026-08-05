export const ICON_SIZE = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 60,
    hero: 96,
} as const;

export type IconSizeType = keyof typeof ICON_SIZE;

// Platform minimum for a tappable box (iOS HIG / Material both land on 44).
export const TOUCH_TARGET_MIN = 44;

// Controls smaller than TOUCH_TARGET_MIN grow their touch area with hitSlop, not their box.
export const HIT_SLOP_SM = 4;
export const HIT_SLOP_MD = 8;
export const HIT_SLOP_LG = 12;

export const CONTROL_SIZE = {
    sm: 30,
    md: 40,
    lg: 50,
} as const;

export type ControlSizeType = keyof typeof CONTROL_SIZE;

export const BADGE_SIZE = 18;

// Circles that frame an icon or illustration.
export const MEDALLION_SIZE = {
    xs: 35,
    sm: 40,
    md: 50,
    lg: 64,
    xl: 80,
    '2xl': 96,
} as const;

export type MedallionSizeType = keyof typeof MEDALLION_SIZE;

export const DOT_SIZE = {
    sm: 8,
    md: 10,
    lg: 12,
} as const;

export type DotSizeType = keyof typeof DOT_SIZE;

export const AVATAR_SIZE = 100;

export const LOGO_SIZE = 128;

// Keys must match ProgressBar's sizeVariant names.
export const PROGRESS_HEIGHT = {
    thin: 4,
    medium: 8,
    large: 10,
    thick: 14,
} as const;

export type ProgressHeightType = keyof typeof PROGRESS_HEIGHT;

// Bar height before the bottom safe-area inset, which the tab layout adds on top.
export const TAB_BAR_HEIGHT = 60;

// Combined width reserved for the header buttons, so the title ellipsizes instead of sliding
// under them. Tune if the buttons change size.
export const HEADER_ACTION_RESERVE = 120;

export const HERO_HEIGHT = 240;

// A landscape footprint, the one shape ui/Media cannot name.
export const WORDMARK_SIZE = {
    width: 100,
    height: 30,
} as const;

export const CHECKBOX_SIZE = 20;

export const HEATMAP_CELL_SIZE = 35;

export const ASPECT = {
    square: 1,
    card: 5 / 6,
    cardFeatured: 2 / 1,
    // Unused today, reserved for video and imagery slots.
    wide: 16 / 9,
} as const;

export type AspectType = keyof typeof ASPECT;

export const SCREEN_FRACTION = {
    heroHeight: 0.3,
    contentWidth: 0.8,
    headingWidth: 0.75,
    modalMaxHeight: 0.7,
    changeLogMaxHeight: 0.4,
} as const;

export type ScreenFractionType = keyof typeof SCREEN_FRACTION;

// Fraction of the parent's block axis a scrim covers.
export const SCRIM_EXTENT = {
    full: 1,
    cardFooter: 0.64,
} as const;

export type ScrimExtentType = keyof typeof SCRIM_EXTENT;

export const MODAL_INLINE_INSET = 50;

export const AUTH_LOGO_INSET = 96;
