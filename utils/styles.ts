import {
    TextStyle,
    ViewStyle,
} from 'react-native';
import { bound } from '@togglecorp/fujs';

import {
    SPACING_2XL,
    SPACING_2XS,
    SPACING_3XL,
    SPACING_3XS,
    SPACING_4XL,
    SPACING_4XS,
    SPACING_LG,
    SPACING_MD,
    SPACING_NONE,
    SPACING_SM,
    SPACING_XL,
    SPACING_XS,
} from '@/constants/dimensions';

export type SpacingType = 'none' | '4xs' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type SpacingMode = 'rowGap' | 'columnGap' | 'paddingInline' | 'paddingBlock';

export const gapSpacings: SpacingMode[] = ['rowGap', 'columnGap'];
export const paddingSpacings: SpacingMode[] = ['paddingBlock', 'paddingInline'];
export const fullSpacings: SpacingMode[] = [
    ...gapSpacings,
    ...paddingSpacings,
];

const spacingValues = [
    SPACING_NONE,
    SPACING_4XS,
    SPACING_3XS,
    SPACING_2XS,
    SPACING_XS,
    SPACING_SM,
    SPACING_MD,
    SPACING_LG,
    SPACING_XL,
    SPACING_2XL,
    SPACING_3XL,
    SPACING_4XL,
];

const spacingTypeToStartIndexMap: Record<SpacingType, number> = {
    none: 0,
    '4xs': 1,
    '3xs': 2,
    '2xs': 3,
    xs: 4,
    sm: 5,
    md: 6,
    lg: 7,
    xl: 8,
    '2xl': 9,
    '3xl': 10,
    '4xl': 11,
};

export function getSpacingValue(spacingType: SpacingType = 'md', offset = 0) {
    const index = bound(
        spacingTypeToStartIndexMap[spacingType] + offset,
        0,
        spacingValues.length - 1,
    );

    return spacingValues[index];
}

export function joinStyles<
    STYLE extends ViewStyle | TextStyle
>(...params: (STYLE | undefined | false)[]) {
    return params.filter(Boolean).reduce((acc, style) => {
        const newAcc = {
            ...acc,
            ...style,
        };

        return newAcc;
    }, {});
}
