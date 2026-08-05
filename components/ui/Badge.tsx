import { type ReactNode } from 'react';
import {
    Pressable,
    Text as NativeText,
    type TextStyle,
    View,
    type ViewStyle,
} from 'react-native';
import { type IconWeight } from 'phosphor-react-native';

import { BORDER_WIDTH_THIN } from '@/constants/border';
import {
    ICON_GLYPH,
    type IconName,
} from '@/constants/icons';
import {
    OPACITY_DISABLED,
    OPACITY_PRESSED,
} from '@/constants/opacity';
import { type RadiusType } from '@/constants/radius';
import {
    BADGE_SIZE,
    DOT_SIZE,
    HIT_SLOP_MD,
    ICON_SIZE,
    type IconSizeType,
    MEDALLION_SIZE,
} from '@/constants/size';
import {
    type AppTheme,
    type ColorRole,
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import {
    type TextVariant,
    typeScale,
} from '@/constants/typography';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveBoxStyle } from '@/utils/layout';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

/** `circle` and `square` take a fixed extent; `pill` hugs its content. */
const SHAPE_RADIUS = {
    circle: 'full',
    square: '2xs',
    pill: 'full',
} as const satisfies Record<string, RadiusType>;

export type BadgeShape = keyof typeof SHAPE_RADIUS;

/** Which slot fills the badge: `surface` for a chip, `content` for a swatch of the colour. */
const STYLE_VARIANT = {
    filled: { fill: 'surface', withRing: false },
    swatch: { fill: 'content', withRing: false },
    ringed: { fill: 'surface', withRing: true },
} as const satisfies Record<string, { fill: keyof ColorRole; withRing: boolean }>;

export type BadgeStyleVariant = keyof typeof STYLE_VARIANT;

interface ExtentRung {
    extent: number;
    icon: IconSizeType;
    text: TextVariant;
}

/** Fixed-footprint ladder. The comment on each rung is its extent in points. */
const EXTENT_VARIANT = {
    /** 8 */
    '3xs': { extent: DOT_SIZE.sm, icon: 'xs', text: 'overline' },
    /** 10 */
    '2xs': { extent: DOT_SIZE.md, icon: 'xs', text: 'overline' },
    /** 12 */
    xs: { extent: DOT_SIZE.lg, icon: 'xs', text: 'overline' },
    /** 18 */
    sm: { extent: BADGE_SIZE, icon: 'xs', text: 'caption' },
    /** 24 */
    md: { extent: ICON_SIZE['2xl'], icon: 'sm', text: 'caption' },
    /** 28 */
    lg: { extent: ICON_SIZE['3xl'], icon: 'md', text: 'caption' },
    /** 35 */
    xl: { extent: MEDALLION_SIZE.xs, icon: '3xl', text: 'label' },
    /** 50 */
    '2xl': { extent: MEDALLION_SIZE.md, icon: '3xl', text: 'label' },
    /** 64 */
    '3xl': { extent: MEDALLION_SIZE.lg, icon: '4xl', text: 'title' },
    /** 80 */
    '4xl': { extent: MEDALLION_SIZE.xl, icon: '6xl', text: 'title' },
    /** 96 */
    '5xl': { extent: MEDALLION_SIZE['2xl'], icon: '6xl', text: 'heading' },
} as const satisfies Record<string, ExtentRung>;

export type BadgeExtentVariant = keyof typeof EXTENT_VARIANT;

interface PillRung {
    insetInline: SpacingType;
    insetBlock: SpacingType;
    space: SpacingType;
    icon: IconSizeType;
    text: TextVariant;
}

/** Hugging ladder. Both rungs are the shipped pills rounded to the spacing scale. */
const PILL_VARIANT = {
    sm: {
        insetInline: '3xs', insetBlock: '4xs', space: '4xs', icon: 'xs', text: 'caption',
    },
    md: {
        insetInline: '2xs', insetBlock: '3xs', space: '4xs', icon: 'xs', text: 'label',
    },
} as const satisfies Record<string, PillRung>;

export type BadgePillVariant = keyof typeof PILL_VARIANT;

/** `strong` is for a small glyph that has to read over imagery. */
const ICON_EMPHASIS_WEIGHT = {
    regular: 'regular',
    strong: 'bold',
} as const satisfies Record<string, IconWeight>;

export type BadgeIconEmphasis = keyof typeof ICON_EMPHASIS_WEIGHT;

// Theme-independent, so built once rather than per render.
const PRESSED_STYLE: ViewStyle = { opacity: OPACITY_PRESSED };
const DISABLED_STYLE: ViewStyle = { opacity: OPACITY_DISABLED };

interface BadgeGeometry {
    extent: number | undefined;
    insetInline: SpacingType | undefined;
    insetBlock: SpacingType | undefined;
    space: SpacingType | undefined;
    icon: IconSizeType;
    text: TextVariant;
}

interface BadgeStyleOptions {
    shape: BadgeShape;
    colorVariant: ColorVariant;
    styleVariant: BadgeStyleVariant;
    dotColor: string | undefined;
    shrink: boolean | undefined;
    extent: number | undefined;
    insetInline: SpacingType | undefined;
    insetBlock: SpacingType | undefined;
    space: SpacingType | undefined;
    text: TextVariant;
}

interface BadgeStyles {
    container: ViewStyle;
    label: TextStyle;
    /** Resolved rather than a variant: the glyph must pair with the fill, not with the page. */
    contentColor: string;
}

const createStyles = (theme: AppTheme, options: BadgeStyleOptions): BadgeStyles => {
    const {
        shape,
        colorVariant,
        styleVariant,
        dotColor,
        shrink,
        extent,
        insetInline,
        insetBlock,
        space,
        text,
    } = options;

    const { fill, withRing } = STYLE_VARIANT[styleVariant];

    // A backend colour has no role to pair with, so the content falls back to textOnPrimary.
    const backgroundColor = dotColor ?? resolveColor(theme, colorVariant, fill);
    const contentColor = dotColor === undefined
        ? resolveColor(theme, colorVariant, 'onSurface')
        : theme.textOnPrimary;

    return {
        container: {
            ...resolveBoxStyle({
                // Required by the pill; harmless for the shapes holding one centred child.
                direction: 'row',
                align: 'center',
                justify: 'center',
                width: extent,
                height: extent,
                gap: space === undefined ? undefined : getSpacingValue(space),
                paddingInline: insetInline === undefined
                    ? undefined
                    : getSpacingValue(insetInline),
                paddingBlock: insetBlock === undefined
                    ? undefined
                    : getSpacingValue(insetBlock),
                radius: SHAPE_RADIUS[shape],
                shrink: shrink ? 1 : undefined,
            }),
            backgroundColor,
            ...(withRing
                ? { borderWidth: BORDER_WIDTH_THIN, borderColor: contentColor }
                : undefined),
        },
        label: {
            ...typeScale[text],
            color: contentColor,
            // So a pill label ellipsizes instead of widening the capsule past its row.
            flexShrink: 1,
            ...(extent === undefined ? undefined : { textAlign: 'center' }),
        },
        contentColor,
    };
};

interface CommonProps {
    /** Defaults to `default`. A fill plus its paired foreground, never `content` alone. */
    colorVariant?: ColorVariant;

    /** Defaults to `filled`. Picks which slot supplies the fill. */
    styleVariant?: BadgeStyleVariant;

    /**
     * Raw colour, and one of four sanctioned in the design system: answer colours are author data
     * off Firebase, so they can never be theme tokens. Overrides colorVariant and forces the
     * content to textOnPrimary, since no legible foreground can be computed for an arbitrary
     * colour. Not a way out of the palette.
     */
    dotColor?: string;

    /** Sized and coloured by the rung. Content renders in the order iconName, children, label. */
    iconName?: IconName;

    /** Defaults to `regular`. `strong` for a small glyph that has to read over imagery. */
    iconEmphasis?: BadgeIconEmphasis;

    label?: string;

    /** Content this layer cannot name. Prefer iconName and label, which cannot mispaint. */
    children?: ReactNode;

    testID?: string;
}

type BadgeGeometryProps = {
    /** Defaults to `circle`. Content that outgrows the rung overflows rather than stretching it. */
    shape?: Exclude<BadgeShape, 'pill'>;
    /** Required: eleven rungs with no majority, so a default would be a guess. */
    sizeVariant: BadgeExtentVariant;
    /** A fixed badge is a circle or a square; shrinking would distort it. */
    shrink?: never;
} | {
    shape: 'pill';
    sizeVariant: BadgePillVariant;
    /** Lets the capsule truncate its label instead of pushing its row. */
    shrink?: boolean;
};

type BadgePressProps = {
    onPress?: never;
    disabled?: never;
    /** A labelled badge announces itself; supply this for one whose only content is colour. */
    accessibilityLabel?: string;
} | {
    onPress: () => void;
    accessibilityLabel: string;
    disabled?: boolean;
};

export type BadgeProps = CommonProps & BadgeGeometryProps & BadgePressProps;

function resolveGeometry(props: BadgeProps): BadgeGeometry {
    if (props.shape === 'pill') {
        const rung = PILL_VARIANT[props.sizeVariant];

        return {
            extent: undefined,
            insetInline: rung.insetInline,
            insetBlock: rung.insetBlock,
            space: rung.space,
            icon: rung.icon,
            text: rung.text,
        };
    }

    const rung = EXTENT_VARIANT[props.sizeVariant];

    return {
        extent: rung.extent,
        insetInline: undefined,
        insetBlock: undefined,
        space: undefined,
        icon: rung.icon,
        text: rung.text,
    };
}

/**
 * The small painted marker: status dot, counter bubble, answer badge, medallion, capsule pill.
 *
 * It does not position itself; a badge that sits proud of a corner belongs in a Positioned. Its
 * label and glyph bypass ui/Text and ui/Icon on purpose, because those resolve a ColorVariant
 * through the role's `content` slot: on a badge the only legible foreground is the fill's paired
 * `onSurface`.
 */
function Badge(props: BadgeProps) {
    const {
        shape = 'circle',
        colorVariant = 'default',
        styleVariant = 'filled',
        dotColor,
        iconName,
        iconEmphasis = 'regular',
        label,
        children,
        shrink,
        testID,
        onPress,
        disabled,
        accessibilityLabel,
    } = props;

    // Takes `props` whole: a destructured `shape` cannot narrow which ladder `sizeVariant` is on.
    const geometry = resolveGeometry(props);

    const styles = useThemedStyles(createStyles, {
        shape,
        colorVariant,
        styleVariant,
        dotColor,
        shrink,
        extent: geometry.extent,
        insetInline: geometry.insetInline,
        insetBlock: geometry.insetBlock,
        space: geometry.space,
        text: geometry.text,
    });

    // The glyph comes from the table rather than ui/Icon: that resolves a ColorVariant through
    // `content`, where a badge glyph has to pair with its own fill through `onSurface`.
    const Glyph = iconName === undefined ? undefined : ICON_GLYPH[iconName];

    const content = (
        <>
            {Glyph === undefined ? null : (
                <Glyph
                    size={ICON_SIZE[geometry.icon]}
                    color={styles.contentColor}
                    weight={ICON_EMPHASIS_WEIGHT[iconEmphasis]}
                />
            )}
            {children}
            {label === undefined ? null : (
                <NativeText
                    style={styles.label}
                    numberOfLines={1}
                    // A fixed badge cannot grow with the OS font setting; a pill reflows.
                    allowFontScaling={geometry.extent === undefined}
                >
                    {label}
                </NativeText>
            )}
        </>
    );

    if (onPress === undefined) {
        return (
            <View
                style={styles.container}
                testID={testID}
                accessible={accessibilityLabel === undefined ? undefined : true}
                accessibilityLabel={accessibilityLabel}
            >
                {content}
            </View>
        );
    }

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            // Several rungs are far below TOUCH_TARGET_MIN.
            hitSlop={HIT_SLOP_MD}
            testID={testID}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            style={({ pressed }) => [
                styles.container,
                pressed && PRESSED_STYLE,
                disabled && DISABLED_STYLE,
            ]}
        >
            {content}
        </Pressable>
    );
}

export default Badge;
