import { bound } from "@togglecorp/fujs";
import { TextStyle, ViewStyle } from "react-native";

export type SpacingType = 'none' | '4xs' | '3xs' | '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
export type SpacingMode = 'rowGap' | 'columnGap' | 'paddingInline' | 'paddingBlock';

export const gapSpacings: SpacingMode[] = ['rowGap', 'columnGap'];
export const paddingSpacings: SpacingMode[] = ['paddingBlock', 'paddingInline'];
export const fullSpacings: SpacingMode[] = [
    ...gapSpacings,
    ...paddingSpacings,
];

// FIXME: get this from system
const BASE_FONT_SIZE = 16;
const OPTICAL_CORRECTION_FACTOR = 1.25;

export function getAdditionalInlineCompensatedSpacingValue(value: number, mode: SpacingMode, use: boolean) {
    if (!use) {
        return value;
    }

    if (mode === 'paddingInline') {
        return value * 1.1 + BASE_FONT_SIZE / 3;
    }

    return value;
}

export function getOpticallyCorrectedSpacingValue(value: number, mode: SpacingMode) {
    // Horizontal padding seems a bit imbalanced
    // due to the gap from the line height in vertical padding
    if (mode === 'paddingBlock' || mode === 'rowGap') {
        return value + (BASE_FONT_SIZE / OPTICAL_CORRECTION_FACTOR - BASE_FONT_SIZE);
    }

    return value;
}

const spacingValues = [
    0,
    4,
    8,
    12,
    16,
    20,
    24,
    28,
    32,
    36,
    40,
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
}

export function getSpacingValue(spacing: SpacingType = 'md', offset = 0) {
    const index = bound(
        spacingTypeToStartIndexMap[spacing] + offset,
        0,
        spacingValues.length - 1,
    );

    return spacingValues[index];
}

export function joinStyles<STYLE extends ViewStyle | TextStyle>(...params: (STYLE | undefined | false)[]) {
    return params.filter(Boolean).reduce((acc, style) => {
        const newAcc = {
            ...acc,
            ...style,
        };

        return newAcc;
    }, {});
}
