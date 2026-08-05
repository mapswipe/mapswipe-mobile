import {
    View,
    type ViewStyle,
} from 'react-native';
import { bound } from '@togglecorp/fujs';

import { type RadiusType } from '@/constants/radius';
import {
    PROGRESS_HEIGHT,
    type ProgressHeightType,
} from '@/constants/size';
import {
    type AppTheme,
    type ColorVariant,
    resolveColor,
    type ThemeColorKey,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveBoxStyle } from '@/utils/layout';

/**
 * A bar is two colours and only the fill is a role. No `surface` slot reaches `backgroundTrack`,
 * and the roles this wants carry a `surface` identical to their `content`, so a bar built from
 * one role's pair would paint fill on fill and read as empty. Each rung names its own track.
 */
const TRACK_COLOR = {
    /** White on the lighter navy: the session chrome, sitting on `backgroundBrand`. */
    onBrand: 'backgroundTrack',
    /** Green on a sunken light track: level progress on a page surface. */
    positive: 'backgroundMuted',
    /** Accent red on a translucent white track: the project card, sitting on imagery. */
    accent: 'trackOnImage',
} satisfies Partial<Record<ColorVariant, ThemeColorKey>>;

export type ProgressBarColorVariant = keyof typeof TRACK_COLOR;

/**
 * The two shapes the app draws: full-bleed bars butt against their container and stay square,
 * the project card's inset bar is a pill.
 */
const STYLE_RADIUS = {
    square: 'none',
    rounded: 'full',
} satisfies Record<string, RadiusType>;

export type ProgressBarStyleVariant = keyof typeof STYLE_RADIUS;

// A share of the track is the one extent no token can express, and RN takes it only as a
// percentage string, so the fraction becomes a percentage here.
const PERCENT = 100;

/**
 * Clamped rather than rejected: progress is a division the caller did, and an off-by-one should
 * not throw away the bar. Non-finite input (0/0 on an empty task list) reads as empty.
 */
function resolveFraction(progress: number): number {
    if (!Number.isFinite(progress)) {
        return 0;
    }

    return bound(progress, 0, 1);
}

interface ProgressBarOptions {
    colorVariant: ProgressBarColorVariant;
    sizeVariant: ProgressHeightType;
    styleVariant: ProgressBarStyleVariant;
    fraction: number;
}

interface ProgressBarStyles {
    track: ViewStyle;
    fill: ViewStyle;
}

const createStyles = (theme: AppTheme, options: ProgressBarOptions): ProgressBarStyles => {
    const {
        colorVariant,
        sizeVariant,
        styleVariant,
        fraction,
    } = options;

    const height = PROGRESS_HEIGHT[sizeVariant];
    const radius = STYLE_RADIUS[styleVariant];

    return {
        track: {
            ...resolveBoxStyle({
                // Stretch rather than width 100%: the bar spans whatever inline space its parent
                // gives it, including a parent that centres its children.
                selfAlign: 'stretch',
                height,
                radius,
                clip: true,
            }),
            backgroundColor: theme[TRACK_COLOR[colorVariant]],
        },
        fill: {
            // Rounded at both ends like the track, so a partial pill keeps its end cap; the
            // track clips it either way, so nothing can paint past the corner.
            ...resolveBoxStyle({ height, radius }),
            width: `${fraction * PERCENT}%`,
            backgroundColor: resolveColor(theme, colorVariant, 'content'),
        },
    };
};

export interface ProgressBarProps {
    /**
     * How full the bar is, as a fraction from 0 to 1. Values outside that clamp, and a
     * non-finite value reads as 0.
     */
    progress: number;
    /**
     * Required. Both colours depend on the surface underneath, so a default would happily
     * draw the white-on-navy session bar onto a white card.
     */
    colorVariant: ProgressBarColorVariant;
    /** Track height. `thin` for the project card, `large` for the profile level bar. */
    sizeVariant?: ProgressHeightType;
    /** `square` for a bar that spans its container, `rounded` for an inset pill. */
    styleVariant?: ProgressBarStyleVariant;
    /** The noun only: the percentage is announced from the value. */
    accessibilityLabel?: string;
    testID?: string;
}

/**
 * A determinate progress bar: a track with a fill sized to a fraction of it. An indeterminate
 * one is a different component, with an animation and a reduce-motion story.
 */
function ProgressBar(props: ProgressBarProps) {
    const {
        progress,
        colorVariant,
        sizeVariant = 'medium',
        styleVariant = 'square',
        accessibilityLabel,
        testID,
    } = props;

    const fraction = resolveFraction(progress);
    const styles = useThemedStyles(createStyles, {
        colorVariant,
        sizeVariant,
        styleVariant,
        fraction,
    });

    return (
        <View
            style={styles.track}
            testID={testID}
            accessibilityRole="progressbar"
            accessibilityLabel={accessibilityLabel}
            accessibilityValue={{
                min: 0,
                max: PERCENT,
                now: Math.round(fraction * PERCENT),
            }}
        >
            <View style={styles.fill} />
        </View>
    );
}

export default ProgressBar;
