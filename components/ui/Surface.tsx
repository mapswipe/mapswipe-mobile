import { type ReactNode } from 'react';
import {
    View,
    type ViewStyle,
} from 'react-native';

import {
    BORDER_WIDTH_MD,
    BORDER_WIDTH_THIN,
} from '@/constants/border';
import {
    type ElevationType,
    getElevationStyle,
} from '@/constants/elevation';
import { type RadiusType } from '@/constants/radius';
import {
    type AppTheme,
    type ColorRole,
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveBoxStyle } from '@/utils/layout';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

/**
 * Which slot of the role paints the ring. Never a `surface` slot: a ring in the colour of the
 * fill behind it is invisible, and never `onSurface`, which exists to be legible as text.
 */
type BorderSlot = Extract<keyof ColorRole, 'border' | 'content'>;

interface SurfaceChrome {
    /** `undefined` draws no ring at all, which is not the same as a zero-width one. */
    border: { width: number; slot: BorderSlot } | undefined;
    /** `undefined` emits no boxShadow key, unlike ELEVATION.none's empty shadow list. */
    elevation: ElevationType | undefined;
}

/**
 * The chrome each rung adds on top of the fill.
 *
 * The two ringed rungs differ in slot as well as width: a hairline in `border` is divider-weight
 * chrome, while a 2px ring is a statement and wants the saturated `content` slot.
 */
const STYLE_VARIANT = {
    flat: {
        border: undefined,
        elevation: undefined,
    },
    outlined: {
        border: { width: BORDER_WIDTH_THIN, slot: 'border' },
        elevation: undefined,
    },
    outlinedStrong: {
        border: { width: BORDER_WIDTH_MD, slot: 'content' },
        elevation: undefined,
    },
    elevated: {
        border: undefined,
        elevation: 'raised',
    },
} as const satisfies Record<string, SurfaceChrome>;

export type SurfaceStyleVariant = keyof typeof STYLE_VARIANT;

/** The rungs that draw a ring, so the border colour prop can be closed off on the others. */
type RingedStyleVariant = Extract<SurfaceStyleVariant, 'outlined' | 'outlinedStrong'>;

/**
 * How the card claims space. `fill` is flexGrow and not `flex: 1`, which would also zero
 * flexBasis and let a card with a fixed aspect ratio collapse.
 */
const FLEX_STYLE = {
    fill: { flexGrow: 1 },
    stretch: { alignSelf: 'stretch' },
} as const satisfies Record<string, ViewStyle>;

export type SurfaceFlexType = keyof typeof FLEX_STYLE;

function resolvePadding(padding: SpacingType | undefined): number | undefined {
    // getSpacingValue defaults an absent rung to 'md', so the guard is what keeps an
    // unpadded surface unpadded.
    return padding === undefined ? undefined : getSpacingValue(padding);
}

interface SurfaceStyleOptions {
    styleVariant: SurfaceStyleVariant;
    colorVariant: ColorVariant;
    borderColorVariant: ColorVariant | undefined;
    radius: RadiusType;
    padding: SpacingType | undefined;
    paddingBlock: SpacingType | undefined;
    paddingInline: SpacingType | undefined;
    flex: SurfaceFlexType | undefined;
    width: number | undefined;
    maxHeight: number | undefined;
    aspectRatio: number | undefined;
    withClipping: boolean | undefined;
}

/**
 * One box, so this returns the style directly. Chrome is a conditional spread: RN reads a
 * present-but-undefined border differently from an absent one.
 */
const createSurfaceStyle = (theme: AppTheme, options: SurfaceStyleOptions): ViewStyle => {
    const {
        styleVariant,
        colorVariant,
        borderColorVariant,
        radius,
        padding,
        paddingBlock,
        paddingInline,
        flex,
        width,
        maxHeight,
        aspectRatio,
        withClipping,
    } = options;

    const { border, elevation } = STYLE_VARIANT[styleVariant];

    return {
        ...resolveBoxStyle({
            radius,
            // Yoga resolves the axis paddings over the shorthand by specificity, not by key
            // order, so emitting all three is safe and the axis props win.
            padding: resolvePadding(padding),
            paddingBlock: resolvePadding(paddingBlock),
            paddingInline: resolvePadding(paddingInline),
            width,
            maxHeight,
            aspectRatio,
            clip: withClipping,
        }),
        // `surface` and never `content`: this is the thing being painted on, and pairing it with
        // the role's own `onSurface` is what keeps the text on it legible.
        backgroundColor: resolveColor(theme, colorVariant, 'surface'),
        ...(flex === undefined ? undefined : FLEX_STYLE[flex]),
        ...(border === undefined ? undefined : {
            borderWidth: border.width,
            borderColor: resolveColor(theme, borderColorVariant ?? colorVariant, border.slot),
        }),
        ...(elevation === undefined ? undefined : getElevationStyle(elevation, theme.shadowColor)),
    };
};

interface CommonProps {
    children: ReactNode;

    /** The role's `surface` slot, so a fill and not a foreground. Defaults to `default`. */
    colorVariant?: ColorVariant;

    radius?: RadiusType;

    /** Inset on every edge. Rhythm between children belongs to the Stack or Row inside. */
    padding?: SpacingType;
    /**
     * Per-axis overrides, for the two cards that are deliberately taller than they are wide
     * on the inside. Each overrides `padding` on its own axis.
     */
    paddingBlock?: SpacingType;
    paddingInline?: SpacingType;

    /** How the card claims space from its parent. See FLEX_STYLE above. */
    flex?: SurfaceFlexType;

    /** Measured geometry only. Left out, the card is as big as its content. */
    width?: number;
    maxHeight?: number;
    /** Pairs with `width` to give a tile a fixed shape, e.g. 2/1 for the featured project card. */
    aspectRatio?: number;

    /** Off by default: it costs a layer on Android, and only edge-to-edge children need it. */
    withClipping?: boolean;

    testID?: string;
}

export type SurfaceProps = CommonProps & ({
    /** Defaults to `flat`: a plain filled panel, which is what half the cards in the app are. */
    styleVariant?: Exclude<SurfaceStyleVariant, RingedStyleVariant>;
    /** A surface with no ring has nothing to colour. */
    borderColorVariant?: never;
} | {
    styleVariant: RingedStyleVariant;
    /**
     * Rings from a different role than the fill, the one pairing no single COLOR_ROLE holds.
     * Safe as a second colour prop because a ring carries no text: it cannot be illegible.
     */
    borderColorVariant?: ColorVariant;
});

/**
 * The card: a painted, optionally ringed or lifted box that holds content and nothing else. No
 * gap, no alignment, no press behaviour, so a real card is a Surface wrapping a Stack or Row.
 *
 * Not Scrim, which is also translucent paint but is a childless leaf on the theme's scrim ramp.
 */
function Surface(props: SurfaceProps) {
    const {
        children,
        styleVariant = 'flat',
        colorVariant = 'default',
        borderColorVariant,
        radius = 'none',
        padding,
        paddingBlock,
        paddingInline,
        flex,
        width,
        maxHeight,
        aspectRatio,
        withClipping,
        testID,
    } = props;

    const style = useThemedStyles(createSurfaceStyle, {
        styleVariant,
        colorVariant,
        borderColorVariant,
        radius,
        padding,
        paddingBlock,
        paddingInline,
        flex,
        width,
        maxHeight,
        aspectRatio,
        withClipping,
    });

    return (
        <View
            style={style}
            testID={testID}
        >
            {children}
        </View>
    );
}

export default Surface;
