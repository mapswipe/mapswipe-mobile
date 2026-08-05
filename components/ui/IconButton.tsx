import { useCallback } from 'react';
import {
    View,
    type ViewStyle,
} from 'react-native';

import Icon, { type IconName } from '@/components/ui/Icon';
import Pressable from '@/components/ui/Pressable';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import {
    BORDER_WIDTH_THIN,
    FOCUS_RING_OFFSET,
    FOCUS_RING_WIDTH,
} from '@/constants/border';
import {
    CONTROL_SIZE,
    ICON_SIZE,
    type IconSizeType,
} from '@/constants/size';
import {
    type AppTheme,
    type COLOR_ROLE,
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveBoxStyle } from '@/utils/layout';
import { getSpacingValue } from '@/utils/styles';

/**
 * `hug` is off the CONTROL_SIZE ladder: its box is the glyph plus a symmetric inset rather than
 * a designed diameter. Written as the sum so the box and the glyph cannot drift apart.
 */
const HUG_GLYPH: IconSizeType = '2xl';
const HUG_INSET = getSpacingValue('3xs');

/** The glyph is derived, not a second size prop: box and glyph are not independent. */
const CONTROL_SIZING = {
    hug: { footprint: ICON_SIZE[HUG_GLYPH] + HUG_INSET + HUG_INSET, glyph: HUG_GLYPH },
    sm: { footprint: CONTROL_SIZE.sm, glyph: 'md' },
    md: { footprint: CONTROL_SIZE.md, glyph: 'xl' },
    lg: { footprint: CONTROL_SIZE.lg, glyph: '2xl' },
} as const satisfies Record<string, { footprint: number; glyph: IconSizeType }>;

export type IconButtonSizeVariant = keyof typeof CONTROL_SIZING;

interface IconButtonChrome {
    /** Fills the disc from the role's `surface` slot. */
    withSurface: boolean;
    /** Hairline ring from the role's `border` slot. */
    withBorder: boolean;
}

/**
 * `outlined` fills as well as rings, because the one ringed button sits over imagery.
 *
 * `plain` paints nothing, which Surface cannot express (it always emits a backgroundColor), and
 * Surface has no outline either. That is why this file owns its disc rather than composing one.
 */
const STYLE_VARIANT = {
    plain: { withSurface: false, withBorder: false },
    filled: { withSurface: true, withBorder: false },
    outlined: { withSurface: true, withBorder: true },
} as const satisfies Record<string, IconButtonChrome>;

export type IconButtonStyleVariant = keyof typeof STYLE_VARIANT;

/** The rungs that paint a disc, so the colour prop can be narrowed on exactly those. */
type PaintedStyleVariant = Exclude<IconButtonStyleVariant, 'plain'>;

type RoleSlots<KEY extends ColorVariant> = (typeof COLOR_ROLE)[KEY];

/**
 * Roles whose `content` and `onSurface` are the same key. ui/Icon can only resolve `content`,
 * so on any other role a filled button would draw the glyph in the colour of its own fill.
 */
type SelfLegibleColorVariant = {
    [KEY in ColorVariant]: RoleSlots<KEY>['content'] extends RoleSlots<KEY>['onSurface']
        ? KEY
        : never;
}[ColorVariant];

/**
 * The glyph over an author-supplied fill. The one pairing the theme cannot vouch for: no token
 * knows how dark the author's colour is, so a pale customOption still yields a pale glyph.
 */
const GLYPH_ON_AUTHOR_FILL = 'onBrand' satisfies ColorVariant;

interface IconButtonStyleOptions {
    colorVariant: ColorVariant;
    styleVariant: IconButtonStyleVariant;
    sizeVariant: IconButtonSizeVariant;
    surfaceColor: string | undefined;
    selected: boolean | undefined;
}

/**
 * One box, so this returns the style rather than a StyleSheet. Chrome is a conditional spread:
 * an explicit `backgroundColor: undefined` is not the same as no key. Opacity is Pressable's.
 */
const createButtonStyle = (theme: AppTheme, options: IconButtonStyleOptions): ViewStyle => {
    const {
        colorVariant,
        styleVariant,
        sizeVariant,
        surfaceColor,
        selected,
    } = options;

    const { withSurface, withBorder } = STYLE_VARIANT[styleVariant];
    const { footprint } = CONTROL_SIZING[sizeVariant];

    // Verified to render on RN 0.85's New Architecture. An outline sits outside the border box,
    // so unlike a border it costs the glyph no room and the disc keeps its footprint whether
    // or not the button is selected. `selectionRing` rather than `card`, which is what ships
    // today: card is #0F172A in the dark theme, i.e. a ring that all but disappears against
    // the dark session background it is drawn on.
    const selectionRing: ViewStyle = {
        outlineStyle: 'dashed',
        outlineWidth: FOCUS_RING_WIDTH,
        outlineOffset: FOCUS_RING_OFFSET,
        outlineColor: theme.selectionRing,
    };

    return {
        ...resolveBoxStyle({
            align: 'center',
            justify: 'center',
            width: footprint,
            height: footprint,
            // RN clamps a corner to half the shorter side, so `full` on a square box is a
            // circle. This is the borderRadius: '50%' the component ships today.
            radius: 'full',
        }),
        ...(withSurface ? {
            backgroundColor: surfaceColor ?? resolveColor(theme, colorVariant, 'surface'),
        } : undefined),
        ...(withBorder ? {
            borderWidth: BORDER_WIDTH_THIN,
            borderColor: resolveColor(theme, colorVariant, 'border'),
        } : undefined),
        ...(selected ? selectionRing : undefined),
    };
};

interface CommonProps<NAME> {
    /** Handed back to every handler, so a row of buttons shares one callback. */
    name: NAME;

    iconName: IconName;

    /** Required: an icon-only button leaves a screen reader nothing to fall back on. */
    accessibilityLabel: string;

    sizeVariant?: IconButtonSizeVariant;

    /**
     * Marks the chosen button in a group and draws the dashed ring.
     *
     * Not announced: ui/Pressable merges only `disabled` into accessibilityState, so an answer
     * group reads as plain buttons to a screen reader.
     */
    selected?: boolean;

    /** Blocks the press and dims the whole target, ui/Pressable's `dim` feedback. */
    disabled?: boolean;

    testID?: string;
}

/** The caption is inside the target, so it dims with the button and accepts the tap. */
type IconButtonLabel = {
    label?: never;
    labelColorVariant?: never;
} | {
    /** Drawn under the glyph at `label` size. */
    label: string;
    /** Defaults to `default`. Independent of the disc's own colour. */
    labelColorVariant?: ColorVariant;
};

type IconButtonPaint = {
    /** Defaults to `plain`: a bare glyph, which is both header buttons and the back button. */
    styleVariant?: Extract<IconButtonStyleVariant, 'plain'>;
    colorVariant?: ColorVariant;
    backendSurfaceColor?: never;
} | {
    styleVariant: PaintedStyleVariant;
    /** Narrowed: see SelfLegibleColorVariant. */
    colorVariant?: SelfLegibleColorVariant;
    backendSurfaceColor?: never;
} | {
    /**
     * A raw colour, and the only one here: an author's `customOptions[].iconColor` off Firebase,
     * so neither a token nor validatable. Implies a filled disc, there being no role to ring.
     */
    backendSurfaceColor: string;
    styleVariant?: never;
    colorVariant?: never;
};

/** A tap, or a press-and-hold. Mirrors ui/Pressable's handler union. */
type IconButtonHandlers<NAME> = {
    onPress: (name: NAME) => void;
    onPressIn?: never;
    onPressOut?: never;
} | {
    onPress?: never;
    /** A hold is only a mode if it ends, so the release half is required with it. */
    onPressIn: (name: NAME) => void;
    onPressOut: (name: NAME) => void;
};

export type IconButtonProps<NAME> =
    CommonProps<NAME>
    & IconButtonLabel
    & IconButtonPaint
    & IconButtonHandlers<NAME>;

/**
 * A round icon-only button, optionally captioned.
 *
 * It does not place itself: where the button sits belongs to the Positioned or Box around it.
 */
function IconButton<const NAME>(props: IconButtonProps<NAME>) {
    const {
        name,
        iconName,
        accessibilityLabel,
        sizeVariant = 'hug',
        label,
        labelColorVariant = 'default',
        selected,
        disabled,
        testID,
        styleVariant,
        colorVariant,
        backendSurfaceColor,
        onPress,
        onPressIn,
        onPressOut,
    } = props;

    const resolvedColorVariant: ColorVariant = colorVariant ?? 'default';

    const resolvedStyleVariant: IconButtonStyleVariant = backendSurfaceColor === undefined
        ? (styleVariant ?? 'plain')
        : 'filled';

    const glyphColorVariant: ColorVariant = backendSurfaceColor === undefined
        ? resolvedColorVariant
        : GLYPH_ON_AUTHOR_FILL;

    const style = useThemedStyles(createButtonStyle, {
        colorVariant: resolvedColorVariant,
        styleVariant: resolvedStyleVariant,
        sizeVariant,
        surfaceColor: backendSurfaceColor,
        selected,
    });

    // ui/Pressable's handlers take no argument, so the payload is bound here and never crosses
    // that boundary.
    const handlePress = useCallback(() => { onPress?.(name); }, [name, onPress]);
    const handlePressIn = useCallback(() => { onPressIn?.(name); }, [name, onPressIn]);
    const handlePressOut = useCallback(() => { onPressOut?.(name); }, [name, onPressOut]);

    const disc = (
        <View style={style}>
            <Icon
                name={iconName}
                sizeVariant={CONTROL_SIZING[sizeVariant].glyph}
                colorVariant={glyphColorVariant}
            />
        </View>
    );

    const content = label === undefined ? disc : (
        <Stack
            spacing="2xs"
            align="center"
        >
            {disc}
            <Text
                variant="label"
                colorVariant={labelColorVariant}
                align="center"
            >
                {label}
            </Text>
        </Stack>
    );

    // Two elements rather than one with conditional handlers: ui/Pressable's handler union
    // rejects a tap and a hold on the same target, and a spread would defeat that check.
    if (onPress !== undefined) {
        return (
            <Pressable
                accessibilityLabel={accessibilityLabel}
                disabled={disabled}
                testID={testID}
                onPress={handlePress}
            >
                {content}
            </Pressable>
        );
    }

    return (
        <Pressable
            accessibilityLabel={accessibilityLabel}
            disabled={disabled}
            testID={testID}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            {content}
        </Pressable>
    );
}

export default IconButton;
