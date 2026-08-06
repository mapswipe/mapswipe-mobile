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
    TOUCH_TARGET_MIN,
} from '@/constants/size';
import {
    type AppTheme,
    type COLOR_ROLE,
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    type AlignType,
    resolveBoxStyle,
} from '@/utils/layout';
import { getSpacingValue } from '@/utils/styles';

// `hug` sizes its box off the glyph instead of the CONTROL_SIZE scale.
const HUG_GLYPH: IconSizeType = '2xl';
const HUG_INSET = getSpacingValue('3xs');

const CONTROL_SIZING = {
    hug: { align: 'center', footprint: ICON_SIZE[HUG_GLYPH] + HUG_INSET + HUG_INSET, glyph: HUG_GLYPH },
    // A native header slot bounds touches to its own frame, so hitSlop cannot reach out of it
    // and the box has to be the whole target. Leading-aligned, or centring the glyph in a
    // 44 box would push it past the platform keyline the slot already sits on.
    header: { footprint: TOUCH_TARGET_MIN, glyph: HUG_GLYPH, align: 'start' },
    sm: { align: 'center', footprint: CONTROL_SIZE.sm, glyph: 'md' },
    md: { align: 'center', footprint: CONTROL_SIZE.md, glyph: 'xl' },
    lg: { align: 'center', footprint: CONTROL_SIZE.lg, glyph: '2xl' },
} as const satisfies Record<string, {
    footprint: number;
    glyph: IconSizeType;
    align: AlignType;
}>;

export type IconButtonSizeVariant = keyof typeof CONTROL_SIZING;

interface IconButtonChrome {
    withSurface: boolean;
    withBorder: boolean;
}

// The disc is drawn here rather than with Surface, which always emits a backgroundColor and has
// no outline.
const STYLE_VARIANT = {
    plain: { withSurface: false, withBorder: false },
    filled: { withSurface: true, withBorder: false },
    outlined: { withSurface: true, withBorder: true },
} as const satisfies Record<string, IconButtonChrome>;

export type IconButtonStyleVariant = keyof typeof STYLE_VARIANT;

type PaintedStyleVariant = Exclude<IconButtonStyleVariant, 'plain'>;

type RoleSlots<KEY extends ColorVariant> = (typeof COLOR_ROLE)[KEY];

// Roles whose `content` and `onSurface` are the same key: on any other role a filled disc would
// draw the glyph in the colour of its own fill.
type SelfLegibleColorVariant = {
    [KEY in ColorVariant]: RoleSlots<KEY>['content'] extends RoleSlots<KEY>['onSurface']
        ? KEY
        : never;
}[ColorVariant];

// The glyph over an author-supplied fill: no token can know how dark that colour is.
const GLYPH_ON_AUTHOR_FILL = 'onBrand' satisfies ColorVariant;

interface IconButtonStyleOptions {
    colorVariant: ColorVariant;
    styleVariant: IconButtonStyleVariant;
    sizeVariant: IconButtonSizeVariant;
    surfaceColor: string | undefined;
    selected: boolean | undefined;
}

// Spread conditionally: `backgroundColor: undefined` is not the same as no key at all.
const createButtonStyle = (theme: AppTheme, options: IconButtonStyleOptions): ViewStyle => {
    const {
        colorVariant,
        styleVariant,
        sizeVariant,
        surfaceColor,
        selected,
    } = options;

    const { withSurface, withBorder } = STYLE_VARIANT[styleVariant];
    const { footprint, align } = CONTROL_SIZING[sizeVariant];

    // An outline sits outside the border box, so the disc keeps its footprint when selected.
    const selectionRing: ViewStyle = {
        outlineStyle: 'dashed',
        outlineWidth: FOCUS_RING_WIDTH,
        outlineOffset: FOCUS_RING_OFFSET,
        outlineColor: theme.selectionRing,
    };

    return {
        ...resolveBoxStyle({
            align,
            justify: 'center',
            width: footprint,
            height: footprint,
            // RN clamps a corner to half the shorter side, so `full` on a square box is a circle.
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
    style?: never;
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
