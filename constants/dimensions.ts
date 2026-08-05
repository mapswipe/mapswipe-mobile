import { Dimensions } from 'react-native';

// The font size scale moved to constants/typography.ts, which now owns the whole type scale.
// Re-exported here so existing '@/constants/dimensions' imports keep resolving.
export {
    FONT_SIZE_2XL,
    FONT_SIZE_2XS,
    FONT_SIZE_3XL,
    FONT_SIZE_LG,
    FONT_SIZE_MD,
    FONT_SIZE_SM,
    FONT_SIZE_XL,
    FONT_SIZE_XS,
} from './typography';

// These values are deliberately unchanged: 101 stack call sites read them and 33 inherit 'md'
// implicitly, so re-cutting the scale would reflow the app with no compile error.
export const SPACING_NONE = 0;
export const SPACING_4XS = 4;
export const SPACING_3XS = 8;
export const SPACING_2XS = 12;
export const SPACING_XS = 16;
export const SPACING_SM = 20;
export const SPACING_MD = 24;
export const SPACING_LG = 28;
export const SPACING_XL = 32;
export const SPACING_2XL = 36;
export const SPACING_3XL = 40;
export const SPACING_4XL = 44;

export const IMAGE_SIZE_MD = 200;

export const SCREEN_WIDTH: number = Dimensions.get('window').width;
export const SCREEN_HEIGHT: number = Dimensions.get('window').height;
