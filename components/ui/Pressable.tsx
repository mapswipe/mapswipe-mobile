import {
    type ReactNode,
    useCallback,
} from 'react';
import {
    type AccessibilityRole,
    Pressable as NativePressable,
    type PressableStateCallbackType,
    type ViewStyle,
} from 'react-native';

import {
    OPACITY_DISABLED,
    OPACITY_FULL,
    OPACITY_PRESSED,
} from '@/constants/opacity';
import useTouchTargetSlop from '@/hooks/useTouchTargetSlop';

// `none` skips the disabled dim too: a wash over an imagery tile reads as a map annotation.
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

const PRESS_ROLE = {
    button: 'button',
    link: 'link',
    tab: 'tab',
    imageButton: 'imagebutton',
} as const satisfies Record<string, AccessibilityRole>;

export type PressRoleType = keyof typeof PRESS_ROLE;

// flex, not flexGrow: flexBasis 0 makes shares equal whatever the labels measure.
const GROW_STYLE: ViewStyle = { flex: 1 };

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
    style?: never;
    children: ReactNode;

    accessibilityLabel: string;

    accessibilityRole?: PressRoleType;

    disabled?: boolean;

    feedback?: PressFeedbackType;

    /** Opts out of the automatic hit slop, where slop would overlap packed siblings. */
    withoutHitSlop?: boolean;

    grow?: boolean;

    testID?: string;
}

// A union, not four optionals: a pressable that does nothing still swallows the touch.
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

    const { hitSlop, onLayout } = useTouchTargetSlop();

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
            onLayout={withoutHitSlop ? undefined : onLayout}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={PRESS_ROLE[accessibilityRole]}
            testID={testID}
        >
            {children}
        </NativePressable>
    );
}

export default Pressable;
