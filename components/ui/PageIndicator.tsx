import {
    View,
    type ViewStyle,
} from 'react-native';

import Box from '@/components/ui/Box';
import { DOT_SIZE } from '@/constants/size';
import {
    type AppTheme,
    type ColorVariant,
    resolveColor,
    type ThemeColorKey,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveBoxStyle } from '@/utils/layout';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

/**
 * The inactive dot, per rung. The track half of a pager is not a role: no COLOR_ROLE slot
 * reaches `backgroundTrack`, so one ColorVariant could not name both halves. The active dot is
 * the role's own `content`, so each rung stays a real ColorVariant.
 */
const INACTIVE_COLOR = {
    /** White on the lighter navy: the tutorial stage indicator, on the brand-backed page. */
    onBrand: 'backgroundTrack',
    /** Brand navy on grey: the onboarding pager, on the ordinary page background. */
    brand: 'textMuted',
} satisfies Partial<Record<ColorVariant, ThemeColorKey>>;

export type PageIndicatorColorVariant = keyof typeof INACTIVE_COLOR;

/** A ratio rather than a second absolute size, so the dot and its capsule cannot drift. */
const ACTIVE_EXTENT_RATIO = {
    tinted: 1,
    expanded: 2,
} as const;

export type PageIndicatorStyleVariant = keyof typeof ACTIVE_EXTENT_RATIO;

// Both pagers draw an 8 pt dot, and DOT_SIZE's other two rungs belong to badges and legend
// swatches, so there is no size axis here to pick a rung on.
const DOT_EXTENT = DOT_SIZE.sm;

interface PageIndicatorOptions {
    colorVariant: PageIndicatorColorVariant;
    styleVariant: PageIndicatorStyleVariant;
}

interface PageIndicatorStyles {
    dot: ViewStyle;
    activeDot: ViewStyle;
}

const createStyles = (theme: AppTheme, options: PageIndicatorOptions): PageIndicatorStyles => {
    const { colorVariant, styleVariant } = options;

    return {
        dot: {
            ...resolveBoxStyle({
                width: DOT_EXTENT,
                height: DOT_EXTENT,
                radius: 'full',
            }),
            backgroundColor: theme[INACTIVE_COLOR[colorVariant]],
        },
        activeDot: {
            // RN clamps a radius to half the shorter side, so `full` rounds the 8 pt dot into a
            // circle and the widened one into a capsule, which is what both call sites hand-roll.
            ...resolveBoxStyle({
                width: DOT_EXTENT * ACTIVE_EXTENT_RATIO[styleVariant],
                height: DOT_EXTENT,
                radius: 'full',
            }),
            backgroundColor: resolveColor(theme, colorVariant, 'content'),
        },
    };
};

export interface PageIndicatorProps {
    /** How many pages the pager holds. A non-positive or non-finite count draws nothing. */
    count: number;
    /**
     * Zero-based index of the page on screen. An out-of-range index marks no dot rather than
     * clamping, so a pager mid-fling shows the same thing it does today.
     */
    currentIndex: number;
    /**
     * Required. Both colours depend on the surface underneath, and neither rung is legible on
     * the other's background: the tutorial's white dots would vanish on the onboarding page.
     */
    colorVariant: PageIndicatorColorVariant;
    /** Defaults to `tinted`, the plain pager dot. See ACTIVE_EXTENT_RATIO. */
    styleVariant?: PageIndicatorStyleVariant;
    /** Gap between dots. Defaults to `3xs` (8), the tutorial's; the onboarding pager uses `2xs`. */
    spacing?: SpacingType;
    /** Announces the row as one node, e.g. "Page 3 of 5". */
    accessibilityLabel?: string;
    testID?: string;
}

/**
 * The row of dots under a pager, one per page, with the current one marked.
 *
 * It paints its own dots rather than composing Badge, which is square by construction and so
 * cannot draw the widened capsule. A Box rather than a Row, because a pager is one
 * accessibility node and Row carries no accessibility props.
 */
function PageIndicator(props: PageIndicatorProps) {
    const {
        count,
        currentIndex,
        colorVariant,
        styleVariant = 'tinted',
        spacing = '3xs',
        accessibilityLabel,
        testID,
    } = props;

    const styles = useThemedStyles(createStyles, { colorVariant, styleVariant });

    // Array.from reads a non-finite length as 0, which is what a pager with no pages should draw.
    const dots = Array.from({ length: Math.max(Math.trunc(count), 0) });

    return (
        <Box
            direction="row"
            justify="center"
            gap={getSpacingValue(spacing)}
            accessible={accessibilityLabel === undefined ? undefined : true}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
        >
            {dots.map((_, index) => (
                <View
                    // A dot has no identity beyond its position, and the row is never reordered.
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    style={index === currentIndex ? styles.activeDot : styles.dot}
                />
            ))}
        </Box>
    );
}

export default PageIndicator;
