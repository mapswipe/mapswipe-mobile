import { type ReactNode } from 'react';
import {
    ActivityIndicator,
    TouchableOpacity,
    type ViewStyle,
} from 'react-native';

import {
    BORDER_WIDTH_MD,
    BORDER_WIDTH_THIN,
} from '@/constants/border';
import {
    OPACITY_DISABLED,
    OPACITY_FULL,
    OPACITY_MUTED,
    OPACITY_PRESSED,
} from '@/constants/opacity';
import { type RadiusType } from '@/constants/radius';
import {
    type AppTheme,
    COLOR_ROLE,
    type ColorRole,
    type ColorVariant,
    resolveColor,
    type ThemeColorKey,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    type AlignType,
    resolveBoxStyle,
} from '@/utils/layout';
import { type SpacingType } from '@/utils/styles';

import Icon, { type IconName } from './Icon';
import Row from './Row';
import Text from './Text';

/**
 * The role whose `content` slot holds a given theme colour, or `never`. Pins a filled button's
 * label at compile time, so editing COLOR_ROLE breaks this file rather than the contrast.
 */
type RoleWithContent<KEY extends ThemeColorKey> = {
    [ROLE in ColorVariant]: (typeof COLOR_ROLE)[ROLE]['content'] extends KEY ? ROLE : never;
}[ColorVariant];

/**
 * ui/Text resolves a ColorVariant through `content`, so a filled button cannot ask for
 * `onSurface` directly: it names the role already carrying that colour as its content. Five
 * roles have no such counterpart and widen to a free choice.
 */
type OnSurfaceLabelRole<ROLE extends ColorVariant> =
    [RoleWithContent<(typeof COLOR_ROLE)[ROLE]['onSurface']>] extends [never]
        ? ColorVariant
        : RoleWithContent<(typeof COLOR_ROLE)[ROLE]['onSurface']>;

/**
 * Label role for a filled button, chosen with the fill so the two cannot disagree.
 *
 * `notice` takes `brand` rather than white: white on the amber surface measures about 1.7:1,
 * and `default` flips to near-white in the dark theme, whereas `brand` is navy in both.
 */
const ON_SURFACE_LABEL: { [ROLE in ColorVariant]: OnSurfaceLabelRole<ROLE> } = {
    default: 'default',
    secondary: 'secondary',
    muted: 'muted',
    brand: 'onBrand',
    onBrand: 'onBrand',
    onImage: 'onImage',
    surface: 'default',
    sunken: 'secondary',
    accent: 'onBrand',
    positive: 'onBrand',
    notice: 'brand',
    negative: 'onBrand',
    informative: 'onBrand',
};

interface ButtonSurface {
    /** Slot that paints the box, or undefined for a variant that paints no box. */
    fill: keyof ColorRole | undefined;
    /** The ring around the box: which slot paints it, and how thick. */
    ring: { slot: keyof ColorRole; width: number } | undefined;
    radius: RadiusType;
    /** Slot the label, icon and spinner take their colour from. */
    label: Extract<keyof ColorRole, 'content' | 'onSurface'>;
    /** ui/Text has no textDecorationLine, so an underline button draws the rule under its box. */
    withRule: boolean;
}

/**
 * The ring takes the role's `content` slot, not its `border` slot: `border` is the chrome
 * hairline, while an outline button rings itself in the colour of its own label.
 */
const STYLE_VARIANT = {
    filled: {
        fill: 'surface',
        ring: undefined,
        radius: 'xs',
        label: 'onSurface',
        withRule: false,
    },
    outline: {
        fill: undefined,
        ring: { slot: 'content', width: BORDER_WIDTH_MD },
        radius: 'xs',
        label: 'content',
        withRule: false,
    },
    transparent: {
        fill: undefined,
        ring: undefined,
        radius: 'xs',
        label: 'content',
        withRule: false,
    },
    underline: {
        fill: undefined,
        ring: undefined,
        radius: 'none',
        label: 'content',
        withRule: true,
    },
} as const satisfies Record<string, ButtonSurface>;

export type ButtonStyleVariant = keyof typeof STYLE_VARIANT;

/** One axis, not two booleans: `pending` implies non-interactive, so the pair would conflict. */
const STATE = {
    default: { opacity: OPACITY_FULL, pressable: true, busy: false },
    /** Unavailable. Dimmed hardest, and announced as disabled. */
    disabled: { opacity: OPACITY_DISABLED, pressable: false, busy: false },
    /** Submitting. Dimmed less than disabled, swaps the icon for a spinner, announced as busy. */
    pending: { opacity: OPACITY_MUTED, pressable: false, busy: true },
} as const;

export type ButtonStateType = keyof typeof STATE;

/** alignSelf rather than `width: '100%'`, which is wrong in a row and redundant in a column. */
const WIDTH_SELF_ALIGN = {
    /** Stretches to the container's cross axis, overriding a centring parent. The default. */
    fill: 'stretch',
    /** Sized by its own content, at the container's leading edge. */
    hug: 'start',
} as const satisfies Record<string, AlignType>;

export type ButtonWidthType = keyof typeof WIDTH_SELF_ALIGN;

interface ButtonPaintOptions {
    colorVariant: ColorVariant;
    styleVariant: ButtonStyleVariant;
    width: ButtonWidthType;
    state: ButtonStateType;
}

interface ButtonPaint {
    container: ViewStyle;
    /** Shared by the label, the icon and the spinner, so they can never drift apart. */
    labelColorVariant: ColorVariant;
    /** The same colour resolved: ActivityIndicator takes a raw colour, not a variant. */
    spinnerColor: string;
}

const createButtonPaint = (theme: AppTheme, options: ButtonPaintOptions): ButtonPaint => {
    const {
        colorVariant,
        styleVariant,
        width,
        state,
    } = options;

    const surface = STYLE_VARIANT[styleVariant];

    const labelColorVariant = surface.label === 'onSurface'
        ? ON_SURFACE_LABEL[colorVariant]
        : colorVariant;
    const labelColor = resolveColor(theme, labelColorVariant, 'content');

    return {
        // Conditional spreads, not explicit undefined: an undefined borderWidth would still
        // shadow whatever RN defaults the edge to, and reads as "no opinion" rather than "none".
        container: {
            ...resolveBoxStyle({
                selfAlign: WIDTH_SELF_ALIGN[width],
                radius: surface.radius,
            }),
            ...(surface.fill === undefined
                ? undefined
                : { backgroundColor: resolveColor(theme, colorVariant, surface.fill) }),
            ...(surface.ring === undefined
                ? undefined
                : {
                    borderWidth: surface.ring.width,
                    borderColor: resolveColor(theme, colorVariant, surface.ring.slot),
                }),
            ...(surface.withRule
                ? { borderBottomWidth: BORDER_WIDTH_THIN, borderBottomColor: labelColor }
                : undefined),
            opacity: STATE[state].opacity,
        },
        labelColorVariant,
        spinnerColor: labelColor,
    };
};

interface CommonProps {
    /** Required even with a title: `accessibilityLabel ?? title` quietly made it optional. */
    accessibilityLabel: string;

    /**
     * Optional here only. ui/Button requires a handler and ui/Link a destination; Link passes
     * none because expo-router's Slot merges the navigating handler into its child.
     */
    onPress?: () => void;

    /** Picks the fill and its foreground together. Defaults to `brand`. */
    colorVariant?: ColorVariant;

    /** The label. Rendered at typeScale.buttonLabel, and never transformed: see below. */
    title?: string;

    /** Leading glyph, drawn at ICON_SIZE.sm to match the label's 14pt. */
    iconName?: IconName;

    /** Content after the label, or instead of it: a label of two lines of different type. */
    children?: ReactNode;

    /** Gap between the icon, the label and any children. Defaults to `xs`. */
    spacing?: SpacingType;

    /** Interaction state. One axis covering enabled, disabled and submitting. */
    state?: ButtonStateType;

    testID?: string;
}

export type ButtonLayoutProps = CommonProps & ({
    styleVariant?: Exclude<ButtonStyleVariant, 'underline'>;
    /** Defaults to `xs`. `none` is for a button whose content is its own full-bleed box. */
    padding?: SpacingType;
    width?: ButtonWidthType;
} | {
    styleVariant: 'underline';
    /** An inline link has no box, so it has no inset and hugs its label. */
    padding?: never;
    width?: never;
});

/**
 * Every pressable in the app that reads as a button.
 *
 * Deliberately no textTransform: capitalizing labels is an English title-case rule that mangles
 * German nouns, does nothing for scripts without case, and fights the Turkish dotless i.
 */
function ButtonLayout(props: ButtonLayoutProps) {
    const {
        accessibilityLabel,
        onPress,
        colorVariant = 'brand',
        styleVariant = 'filled',
        title,
        iconName,
        children,
        spacing = 'xs',
        state = 'default',
        testID,
        padding: paddingProp,
        width: widthProp,
    } = props;

    const { pressable, busy } = STATE[state];

    // The underline arm of the props union already makes both unrepresentable; these are the
    // values it stands for.
    const isUnderline = styleVariant === 'underline';
    const width = isUnderline ? 'hug' : (widthProp ?? 'fill');
    const padding = isUnderline ? 'none' : (paddingProp ?? 'xs');

    const {
        container,
        labelColorVariant,
        spinnerColor,
    } = useThemedStyles(createButtonPaint, {
        colorVariant,
        styleVariant,
        width,
        state,
    });

    return (
        <TouchableOpacity
            style={container}
            onPress={onPress}
            disabled={!pressable}
            activeOpacity={OPACITY_PRESSED}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="button"
            accessibilityState={{ disabled: !pressable, busy }}
            testID={testID}
        >
            <Row
                spacing={spacing}
                padding={padding}
                justify="center"
            >
                {busy && (
                    <ActivityIndicator
                        size="small"
                        color={spinnerColor}
                    />
                )}
                {!busy && iconName !== undefined && (
                    <Icon
                        name={iconName}
                        sizeVariant="sm"
                        colorVariant={labelColorVariant}
                    />
                )}
                {title !== undefined && (
                    <Text
                        variant="buttonLabel"
                        colorVariant={labelColorVariant}
                        // The row does not wrap, so a long label has to be able to shrink
                        // below its measured width and break internally instead.
                        flex="shrink"
                    >
                        {title}
                    </Text>
                )}
                {children}
            </Row>
        </TouchableOpacity>
    );
}

export default ButtonLayout;
