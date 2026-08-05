import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    type ActivityIndicatorProps,
    Animated,
    type ImageSourcePropType,
} from 'react-native';

import loadingMark from '@/assets/images/custom/loadinganimation.gif';
import {
    DURATION_AMBIENT,
    DURATION_INSTANT,
    EASING_AMBIENT,
} from '@/constants/motion';
import {
    OPACITY_FULL,
    OPACITY_HIDDEN,
} from '@/constants/opacity';
import { MEDALLION_SIZE } from '@/constants/size';
import {
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import useA11yPreferences from '@/hooks/useA11yPreferences';
import useTheme from '@/hooks/useTheme';

/** `indicator` brings its own artwork, so it has no source. The source selects the branch below. */
const STYLE_MARK = {
    indicator: undefined,
    splash: loadingMark,
} as const satisfies Record<string, ImageSourcePropType | undefined>;

export type SpinnerStyleVariant = keyof typeof STYLE_MARK;

/**
 * Two rungs, because the platform indicator has two: `size` takes a number on Android only, so
 * an ICON_SIZE ladder would be one size on iOS and eleven on Android.
 */
const INDICATOR_SIZE = {
    /** Inline, sharing a line with text. */
    sm: 'small',
    /** Standing on its own as the whole content of a screen or a slot. */
    lg: 'large',
} as const satisfies Record<string, ActivityIndicatorProps['size']>;

export type SpinnerSizeVariant = keyof typeof INDICATOR_SIZE;

/**
 * Footprint of the splash mark. Loader draws the gif at 100 and the nearest rung on the medallion
 * ladder is 96; 4 pt on a full-screen mark is not a look, and a token is the point.
 */
const MARK_SIZE = MEDALLION_SIZE['2xl'];

interface CommonProps {
    /** Omit it when text beside the spinner already says it: unlabelled, it stays silent. */
    accessibilityLabel?: string;
    testID?: string;
}

export type SpinnerProps = CommonProps & ({
    styleVariant?: Extract<SpinnerStyleVariant, 'indicator'>;
    /** Defaults to `default`; RN's own fallback is near-invisible on the brand navy. */
    colorVariant?: ColorVariant;
    /** Defaults to `lg`, the block-level rung. `sm` is the deliberate inline exception. */
    sizeVariant?: SpinnerSizeVariant;
} | {
    styleVariant: Extract<SpinnerStyleVariant, 'splash'>;
    /** The mark is a bitmap, so there is no glyph to tint and nothing a ColorVariant could do. */
    colorVariant?: never;
    sizeVariant?: never;
});

/**
 * The one loading indicator, and a leaf: no label, no centring, no full-screen background.
 *
 * Reduce motion means "jump to the resting value and start nothing", never a zero duration: a
 * zero-duration timing completes the moment it starts, so a loop restarts it every frame.
 *
 * The indicator keeps spinning under the setting on purpose: it is an indeterminate busy signal,
 * and `animating={false}` would make it vanish outright.
 */
function Spinner(props: SpinnerProps) {
    const {
        styleVariant = 'indicator',
        colorVariant = 'default',
        sizeVariant = 'lg',
        accessibilityLabel,
        testID,
    } = props;

    const theme = useTheme();
    const { reduceMotion } = useA11yPreferences();

    // Lazy init: `new Animated.Value(...)` as a bare argument would build a fresh value on every
    // render and throw all but the first away.
    const [breathe] = useState(() => new Animated.Value(OPACITY_HIDDEN));

    const source = STYLE_MARK[styleVariant];
    const duration = reduceMotion ? DURATION_INSTANT : DURATION_AMBIENT;

    useEffect(() => {
        // The platform indicator animates itself; nothing to drive.
        if (source === undefined) {
            return undefined;
        }

        if (duration === DURATION_INSTANT) {
            breathe.setValue(OPACITY_FULL);
            return undefined;
        }

        const leg = (toValue: number) => Animated.timing(breathe, {
            toValue,
            duration,
            easing: EASING_AMBIENT,
            // Opacity is one of the properties the native driver handles, so the breathe keeps
            // time even while JS is busy parsing the payload that the screen is waiting on.
            useNativeDriver: true,
        });

        const animation = Animated.loop(Animated.sequence([
            leg(OPACITY_FULL),
            leg(OPACITY_HIDDEN),
        ]));

        animation.start();

        return () => {
            animation.stop();
        };
    }, [breathe, duration, source]);

    // Built outside the JSX: an object literal in a style prop is an inline style, which this
    // directory forbids, and the animated value cannot live in a StyleSheet.
    const markStyle = useMemo(() => ({
        width: MARK_SIZE,
        height: MARK_SIZE,
        opacity: breathe,
    }), [breathe]);

    const labelled = accessibilityLabel !== undefined;

    if (source !== undefined) {
        return (
            <Animated.Image
                source={source}
                style={markStyle}
                accessible={labelled}
                accessibilityRole={labelled ? 'progressbar' : undefined}
                accessibilityLabel={accessibilityLabel}
                testID={testID}
            />
        );
    }

    return (
        <ActivityIndicator
            size={INDICATOR_SIZE[sizeVariant]}
            // A foreground drawn on whatever the parent painted, so it takes the `content` slot
            // and pairs with the text beside it, exactly as Icon does.
            color={resolveColor(theme, colorVariant, 'content')}
            accessible={labelled}
            accessibilityRole={labelled ? 'progressbar' : undefined}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
        />
    );
}

export default Spinner;
