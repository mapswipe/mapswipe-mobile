import { type ReactNode } from 'react';
import {
    Text as NativeText,
    type TextStyle,
} from 'react-native';

import {
    type AppTheme,
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import {
    FONT_WEIGHT_BOLD,
    FONT_WEIGHT_MEDIUM,
    FONT_WEIGHT_REGULAR,
    FONT_WEIGHT_SEMIBOLD,
    TEXT_SHADOW_ON_IMAGE,
    type TextVariant,
    typeScale,
} from '@/constants/typography';
import useThemedStyles from '@/hooks/useThemedStyles';

/**
 * Logical, not physical: RN has no `start`, but `auto` already resolves to the writing
 * direction's leading edge. No `end`, since RN offers no direction-relative spelling for it.
 */
// RN's spelling of "follow the writing direction". Named rather than inlined because 'auto'
// reads as "unset", which it is not, and because the raw-size lint rule matches a property
// called `start` by name alone: elsewhere in this directory it is an inset.
const WRITING_DIRECTION_START = 'auto';

const TEXT_ALIGN = {
    start: WRITING_DIRECTION_START,
    center: 'center',
} as const satisfies Record<string, TextStyle['textAlign']>;

export type TextAlignType = keyof typeof TEXT_ALIGN;

const FONT_WEIGHT = {
    regular: FONT_WEIGHT_REGULAR,
    medium: FONT_WEIGHT_MEDIUM,
    semibold: FONT_WEIGHT_SEMIBOLD,
    bold: FONT_WEIGHT_BOLD,
} as const;

export type TextWeightType = keyof typeof FONT_WEIGHT;

/** No `uppercase` or `lowercase` rung yet: nothing in the app needs one. */
const TEXT_TRANSFORM = {
    none: 'none',
    capitalize: 'capitalize',
} as const satisfies Record<string, TextStyle['textTransform']>;

export type TextTransformType = keyof typeof TEXT_TRANSFORM;

const FLEX_STYLE = {
    /** Takes the leftover inline space and may shrink below its content, so it can ellipsize. */
    fill: { flex: 1 },
    /** Shrinks below its content without claiming the leftover space. */
    shrink: { flexShrink: 1 },
} as const;

export type TextFlexType = keyof typeof FLEX_STYLE;

interface TextStyleOptions {
    variant: TextVariant;
    colorVariant: ColorVariant;
    align: TextAlignType | undefined;
    weight: TextWeightType | undefined;
    transform: TextTransformType;
    flex: TextFlexType | undefined;
    withLegibilityShadow: boolean | undefined;
    withUnderline: boolean | undefined;
}

/**
 * One node, so this returns the style directly. Overrides are conditional spreads: an explicit
 * `fontWeight: undefined` would clobber the weight the typeScale spread just set.
 */
const createTextStyle = (theme: AppTheme, options: TextStyleOptions): TextStyle => {
    const {
        variant,
        colorVariant,
        align,
        weight,
        transform,
        flex,
        withLegibilityShadow,
        withUnderline,
    } = options;

    return {
        ...typeScale[variant],
        color: resolveColor(theme, colorVariant, 'content'),
        // Always emitted, unlike the other overrides: the default is the point. A nested Text
        // inherits textTransform, so omitting the key would let an ancestor's transform reach
        // a label that asked for none.
        textTransform: TEXT_TRANSFORM[transform],
        ...(align === undefined ? undefined : { textAlign: TEXT_ALIGN[align] }),
        ...(weight === undefined ? undefined : { fontWeight: FONT_WEIGHT[weight] }),
        ...(flex === undefined ? undefined : FLEX_STYLE[flex]),
        ...(withLegibilityShadow ? TEXT_SHADOW_ON_IMAGE : undefined),
        ...(withUnderline ? { textDecorationLine: 'underline' as const } : undefined),
    };
};

interface CommonProps {
    children: ReactNode;

    /**
     * The whole type ramp. Defaults to `default` (16/24/400).
     *
     * Not inherited by a nested Text, since the variant sets fontSize outright: a bold segment
     * inside a non-default parent has to repeat the parent's variant.
     */
    variant?: TextVariant;

    /** Resolved through the role's `content` slot: this is a foreground, never a surface. */
    colorVariant?: ColorVariant;

    /** Left out, alignment is inherited. `start` is the explicit opt-out from that. */
    align?: TextAlignType;

    /** Overrides the variant's weight in either direction. See FONT_WEIGHT above. */
    weight?: TextWeightType;

    /** Defaults to `none`, retiring ButtonLayout's blanket capitalize across all 18 locales. */
    transform?: TextTransformType;

    /** For text in a Row beside an icon, which must ellipsize rather than push it out. */
    flex?: TextFlexType;

    /** No ellipsizeMode prop: 'tail' is the only mode Android honours past the first line. */
    numberOfLines?: number;

    /**
     * Pins against the OS font-size setting; off by default. Only where scaled text would break
     * geometry rather than reflow, e.g. a fixed-height tile.
     */
    withoutFontScaling?: boolean;

    /** TEXT_SHADOW_ON_IMAGE, for text sitting directly on imagery with no surface behind it. */
    withLegibilityShadow?: boolean;

    /**
     * For an inline link, where the surrounding copy is the same size and colour: without a
     * rule the link is invisible to anyone not using a screen reader.
     */
    withUnderline?: boolean;

    testID?: string;
}

export type TextProps = CommonProps & ({
    onPress?: never;
    /** A non-pressable Text is announced by its content; a label would shadow it. */
    accessibilityLabel?: never;
} | {
    /**
     * For an inline link. Anything reading as a control belongs in a Button: this has no press
     * feedback, no hit slop and no disabled state.
     */
    onPress: () => void;
    /** Required with onPress: the link text alone is rarely a usable destination. */
    accessibilityLabel: string;
});

/**
 * Every piece of text in the app. Every variant carries an explicit lineHeight and drops
 * Android's font padding, so a block occupies the same height on both platforms.
 */
function Text(props: TextProps) {
    const {
        children,
        variant = 'default',
        colorVariant = 'default',
        align,
        weight,
        transform = 'none',
        flex,
        numberOfLines,
        withoutFontScaling,
        withLegibilityShadow,
        withUnderline,
        testID,
        onPress,
        accessibilityLabel,
    } = props;

    const style = useThemedStyles(createTextStyle, {
        variant,
        colorVariant,
        align,
        weight,
        transform,
        flex,
        withLegibilityShadow,
        withUnderline,
    });

    return (
        <NativeText
            style={style}
            numberOfLines={numberOfLines}
            // undefined rather than true, so the value keeps inheriting from a parent Text.
            allowFontScaling={withoutFontScaling === undefined ? undefined : !withoutFontScaling}
            testID={testID}
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={onPress === undefined ? undefined : 'link'}
        >
            {children}
        </NativeText>
    );
}

export default Text;
