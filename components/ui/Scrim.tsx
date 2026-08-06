import {
    View,
    type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
    SCRIM_EXTENT,
    type ScrimExtentType,
} from '@/constants/size';
import {
    type AppTheme,
    type ThemeColorKey,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    type AnchorType,
    resolveBoxStyle,
} from '@/utils/layout';

/** Not a ColorVariant: no COLOR_ROLE `surface` slot reaches a scrim key. */
export type ScrimColorVariant = 'modal' | 'default' | 'soft' | 'medium' | 'strong';

const VARIANT_COLOR: Record<ScrimColorVariant, ThemeColorKey> = {
    modal: 'scrimModal',
    default: 'scrim',
    soft: 'scrimSoft',
    medium: 'scrimMedium',
    strong: 'scrimStrong',
};

/** Spanning anchors only: a wash has no content, so a corner-pinned one paints nothing. */
type ScrimAnchorType = Extract<AnchorType, 'top' | 'bottom' | 'fill'>;

// The empty end of a fade. Not a theme key: it is the absence of paint rather than a colour, so
// there is nothing to theme, and 'transparent' is what RN calls it.
const NO_PAINT = 'transparent';

// RN accepts a share of the parent only as a percentage string. The 100 is arithmetic, not a size
// literal. The share itself is never a caller's number: it comes from a named SCRIM_EXTENT value,
// so a call site asks for the look it wants rather than stating a percentage.
const PERCENT = 100;

interface ScrimOptions {
    colorVariant: ScrimColorVariant;
    anchor: ScrimAnchorType;
    fade: boolean | undefined;
    extent: ScrimExtentType | undefined;
}

interface ScrimPaint {
    style: ViewStyle;
    /** Two stops for a fade; undefined for a flat wash, which paints through backgroundColor. */
    fadeColors: readonly [string, string] | undefined;
}

/**
 * Geometry and paint resolve together: it is the same box either way, and exactly one of the two
 * ways to paint it may carry the colour.
 */
const createScrim = (theme: AppTheme, options: ScrimOptions): ScrimPaint => {
    const {
        colorVariant,
        anchor,
        fade,
        extent,
    } = options;

    const color = theme[VARIANT_COLOR[colorVariant]];

    const style: ViewStyle = {
        ...resolveBoxStyle({ anchor }),
        backgroundColor: fade ? undefined : color,
        height: extent === undefined ? undefined : `${SCRIM_EXTENT[extent] * PERCENT}%`,
    };

    if (!fade) {
        return { style, fadeColors: undefined };
    }

    // LinearGradient ramps top to bottom by default, so the stop order is the direction, and the
    // anchored edge is the one that keeps the colour.
    return {
        style,
        fadeColors: anchor === 'top' ? [color, NO_PAINT] : [NO_PAINT, color],
    };
};

interface CommonProps {
    style?: never;
    /** Required: no strength is the majority. */
    colorVariant: ScrimColorVariant;
}

export type ScrimProps = CommonProps & ({
    /** Spans the parent on both axes. The default, and the shape of a full-bleed dim. */
    anchor?: Extract<ScrimAnchorType, 'fill'>;
    /**
     * A fill pins both block edges, which leaves a ramp nothing to run along and an extent
     * nothing to do.
     */
    fade?: never;
    extent?: never;
} | {
    anchor: Exclude<ScrimAnchorType, 'fill'>;
    /**
     * Ramps rather than floods, in the direction the anchor already gives. Block axis only:
     * LinearGradient's endpoints are physical x/y, so an inline ramp would need hand-mirroring.
     */
    fade?: boolean;
    /** Named for the job. Left out, the wash is only as tall as the anchor makes it. */
    extent?: ScrimExtentType;
});

/**
 * The translucent wash that keeps text legible over imagery, or dims what is behind a modal.
 *
 * A childless leaf on purpose, so it can never become the thing that centres a dialog.
 */
function Scrim(props: ScrimProps) {
    const {
        colorVariant,
        anchor = 'fill',
        fade,
        extent,
    } = props;

    const { style, fadeColors } = useThemedStyles(createScrim, {
        colorVariant,
        anchor,
        fade,
        extent,
    });

    if (fadeColors === undefined) {
        return (
            // Decoration with no content of its own: taking a touch would only ever be a bug.
            <View
                style={style}
                pointerEvents="none"
            />
        );
    }

    return (
        <LinearGradient
            colors={fadeColors}
            style={style}
            pointerEvents="none"
        />
    );
}

export default Scrim;
