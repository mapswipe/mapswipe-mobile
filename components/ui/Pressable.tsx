import {
    type ReactNode,
    useCallback,
    useState,
} from 'react';
import {
    type AccessibilityRole,
    type Insets,
    type LayoutChangeEvent,
    Pressable as NativePressable,
    type PressableStateCallbackType,
    type ViewStyle,
} from 'react-native';

import {
    OPACITY_DISABLED,
    OPACITY_FULL,
    OPACITY_PRESSED,
} from '@/constants/opacity';
import {
    HIT_SLOP_LG,
    TOUCH_TARGET_MIN,
} from '@/constants/size';

/**
 * Press feedback, as the opacity the subtree drops to.
 *
 * The disabled rung travels with it: a target that wants no press feedback (an imagery tile)
 * equally must not dim when disabled, since a wash over a tile reads as a map annotation.
 */
const FEEDBACK_OPACITY = {
    dim: {
        pressed: OPACITY_PRESSED,
        disabled: OPACITY_DISABLED,
    },
    none: {
        pressed: OPACITY_FULL,
        disabled: OPACITY_FULL,
    },
} as const;

export type PressFeedbackType = keyof typeof FEEDBACK_OPACITY;

/** Keys name the intent, values are the platform's vocabulary (hence `imagebutton`). */
const PRESS_ROLE = {
    button: 'button',
    link: 'link',
    tab: 'tab',
    imageButton: 'imagebutton',
} as const satisfies Record<string, AccessibilityRole>;

export type PressRoleType = keyof typeof PRESS_ROLE;

// flex, not flexGrow: the tab bar's buttons take equal shares whatever their labels measure,
// which is flexBasis 0. Row's `grow` is deliberately the flexGrow-only one.
const GROW_STYLE: ViewStyle = { flex: 1 };

// The shortfall is shared between two opposite edges.
const HALF = 2;

/**
 * How far one edge reaches out for the target to measure TOUCH_TARGET_MIN on that axis, capped
 * at HIT_SLOP_LG: uncapped slop reaches further than the control is wide, so taps hit neighbours.
 */
function edgeInset(extent: number): number {
    const shortfall = TOUCH_TARGET_MIN - extent;

    if (shortfall <= 0) {
        return 0;
    }

    return Math.min(shortfall / HALF, HIT_SLOP_LG);
}

function resolveOpacity(
    feedback: PressFeedbackType,
    pressed: boolean,
    disabled: boolean | undefined,
): number {
    const opacity = FEEDBACK_OPACITY[feedback];

    if (disabled) {
        return opacity.disabled;
    }

    if (pressed) {
        return opacity.pressed;
    }

    return OPACITY_FULL;
}

interface CommonProps {
    children: ReactNode;

    /** Required. A plain string, not a node: it is read aloud, never rendered. */
    accessibilityLabel: string;

    /** Defaults to `button`, which is what all but the tab bar and the inline links are. */
    accessibilityRole?: PressRoleType;

    /** RN's Pressable merges this into accessibilityState itself. */
    disabled?: boolean;

    /** Defaults to `dim`. `none` where a press wash would read as a selection tint. */
    feedback?: PressFeedbackType;

    /**
     * Opts out of the automatic hit slop, for a target packed against its siblings: on a
     * locate grid cell, slop spills over neighbours and the topmost view wins the touch.
     */
    withoutHitSlop?: boolean;

    /**
     * An equal share of the parent's main axis. No padding prop: padding on the child grows
     * the child, and the pressable wraps it, so the touch area already covers it.
     */
    grow?: boolean;

    testID?: string;
}

/**
 * A union, not four optionals: a pressable that does nothing still swallows the touch. Handlers
 * take no argument, so a view never holds an RN gesture event.
 */
type PressHandlers = {
    onPress: () => void;
    onLongPress?: () => void;
    onPressIn?: never;
    onPressOut?: never;
} | {
    onPress?: never;
    onLongPress: () => void;
    onPressIn?: never;
    onPressOut?: never;
} | {
    onPress?: never;
    onLongPress?: never;
    /** A hold is only a mode if it ends, so the release half is required with it. */
    onPressIn: () => void;
    onPressOut: () => void;
};

export type PressableProps = CommonProps & PressHandlers;

/**
 * Every touch target in the app.
 *
 * It paints nothing: the pressable is the gesture, not the look. What it owns is what a target
 * must not be allowed to forget, namely feedback, disabled state, label and minimum touch area.
 */
function Pressable(props: PressableProps) {
    const {
        children,
        accessibilityLabel,
        accessibilityRole = 'button',
        disabled,
        feedback = 'dim',
        withoutHitSlop = false,
        grow = false,
        testID,
        onPress,
        onLongPress,
        onPressIn,
        onPressOut,
    } = props;

    const [hitSlop, setHitSlop] = useState<Insets>();

    /**
     * Measured rather than declared: only the layout knows how tall a text target is, and slop
     * is per-axis (a full-width row is short, not narrow). A big enough target resolves to
     * undefined, which is the initial state, so React bails out without a second commit.
     */
    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;

        const inline = edgeInset(width);
        const block = edgeInset(height);

        setHitSlop((current) => {
            if (inline === 0 && block === 0) {
                return undefined;
            }

            if (current?.left === inline && current?.top === block) {
                return current;
            }

            // Physical edges, and RN offers no logical spelling. It does not matter here:
            // the two inline edges always carry the same inset, so there is nothing for RTL
            // to mirror.
            return {
                top: block,
                bottom: block,
                left: inline,
                right: inline,
            };
        });
    }, []);

    // The function form is how RN hands back the pressed flag: the state lives inside its
    // Pressable, so nothing above this component re-renders on a touch.
    const resolveStyle = useCallback(({ pressed }: PressableStateCallbackType): ViewStyle => ({
        ...(grow ? GROW_STYLE : undefined),
        opacity: resolveOpacity(feedback, pressed, disabled),
    }), [disabled, feedback, grow]);

    return (
        <NativePressable
            style={resolveStyle}
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            disabled={disabled}
            hitSlop={withoutHitSlop ? undefined : hitSlop}
            onLayout={withoutHitSlop ? undefined : handleLayout}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={PRESS_ROLE[accessibilityRole]}
            testID={testID}
        >
            {children}
        </NativePressable>
    );
}

export default Pressable;
