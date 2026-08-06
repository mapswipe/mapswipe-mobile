import type { TextStyle } from 'react-native';

export const FONT_SIZE_2XS = 10;
export const FONT_SIZE_XS = 12;
export const FONT_SIZE_SM = 14;
export const FONT_SIZE_MD = 16;
export const FONT_SIZE_LG = 18;
export const FONT_SIZE_XL = 20;
export const FONT_SIZE_2XL = 24;
export const FONT_SIZE_3XL = 30;

// Numeric strings, not 'regular'/'medium': those typecheck but Fabric rejects them.
export const FONT_WEIGHT_REGULAR = '400' satisfies TextStyle['fontWeight'];
export const FONT_WEIGHT_MEDIUM = '500' satisfies TextStyle['fontWeight'];
export const FONT_WEIGHT_SEMIBOLD = '600' satisfies TextStyle['fontWeight'];
export const FONT_WEIGHT_BOLD = '700' satisfies TextStyle['fontWeight'];

// Ratios, for callers that derive a lineHeight from an arbitrary font size. The typeScale
// below ships resolved px values instead, so these are not what it is built from.
export const LINE_HEIGHT_TIGHT = 1.2;
export const LINE_HEIGHT_SNUG = 1.35;
export const LINE_HEIGHT_NORMAL = 1.5;

export const LETTER_SPACING_TIGHT = -0.4;
export const LETTER_SPACING_NORMAL = 0;
export const LETTER_SPACING_WIDE = 0.4;
export const LETTER_SPACING_CAPS = 0.8;

// Legibility shadow for text sitting directly on imagery. RN 0.85 has no `textShadow`
// shorthand (TextStyle and ReactNativeStyleAttributes expose only these three longhands),
// so the react-native-web deprecation warning has no native form to migrate to yet.
export const TEXT_SHADOW_ON_IMAGE = {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
} satisfies TextStyle;

// Every variant pins lineHeight in px and drops Android's font padding, so a text block
// occupies the same height on both platforms.
export const typeScale = {
    display: {
        fontSize: FONT_SIZE_3XL,
        lineHeight: 36,
        fontWeight: FONT_WEIGHT_BOLD,
        includeFontPadding: false,
    },
    heading: {
        fontSize: FONT_SIZE_2XL,
        lineHeight: 30,
        fontWeight: FONT_WEIGHT_BOLD,
        includeFontPadding: false,
    },
    title: {
        fontSize: FONT_SIZE_LG,
        lineHeight: 24,
        fontWeight: FONT_WEIGHT_BOLD,
        includeFontPadding: false,
    },
    subtitle: {
        fontSize: FONT_SIZE_MD,
        lineHeight: 22,
        fontWeight: FONT_WEIGHT_SEMIBOLD,
        includeFontPadding: false,
    },
    default: {
        fontSize: FONT_SIZE_MD,
        lineHeight: 24,
        fontWeight: FONT_WEIGHT_REGULAR,
        includeFontPadding: false,
    },
    description: {
        fontSize: FONT_SIZE_MD,
        lineHeight: 24,
        fontWeight: FONT_WEIGHT_REGULAR,
        includeFontPadding: false,
    },
    label: {
        fontSize: FONT_SIZE_SM,
        lineHeight: 20,
        fontWeight: FONT_WEIGHT_MEDIUM,
        includeFontPadding: false,
    },
    caption: {
        fontSize: FONT_SIZE_XS,
        lineHeight: 16,
        fontWeight: FONT_WEIGHT_REGULAR,
        includeFontPadding: false,
    },
    overline: {
        fontSize: FONT_SIZE_2XS,
        lineHeight: 14,
        fontWeight: FONT_WEIGHT_SEMIBOLD,
        letterSpacing: LETTER_SPACING_CAPS,
        includeFontPadding: false,
    },
    value: {
        fontSize: FONT_SIZE_2XL,
        lineHeight: 28,
        fontWeight: FONT_WEIGHT_BOLD,
        // Digits keep a fixed advance width, so a counter does not jitter as it ticks.
        fontVariant: ['tabular-nums'],
        includeFontPadding: false,
    },
    buttonLabel: {
        fontSize: FONT_SIZE_SM,
        lineHeight: 20,
        fontWeight: FONT_WEIGHT_BOLD,
        includeFontPadding: false,
    },
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof typeScale;
