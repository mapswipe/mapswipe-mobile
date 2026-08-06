import { useCallback } from 'react';
import {
    Pressable,
    type PressableStateCallbackType,
    View,
    type ViewStyle,
} from 'react-native';

import { BORDER_WIDTH_MD } from '@/constants/border';
import { ICON_GLYPH } from '@/constants/icons';
import {
    OPACITY_DISABLED,
    OPACITY_FULL,
    OPACITY_PRESSED,
} from '@/constants/opacity';
import {
    CHECKBOX_SIZE,
    ICON_SIZE,
    TOUCH_TARGET_MIN,
} from '@/constants/size';
import {
    type AppTheme,
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveBoxStyle } from '@/utils/layout';

/** Computed rather than a literal, so the target stays exactly 44 if either token moves. */
const PRESS_SLOP = (TOUCH_TARGET_MIN - CHECKBOX_SIZE) / 2;

// Press feedback carries no colour, so it is theme-independent and can be a module constant
// with a stable identity. 0.7 is what every other touchable in the app dims to.
const PRESSED_STYLE: ViewStyle = { opacity: OPACITY_PRESSED };

interface CheckboxOptions {
    colorVariant: ColorVariant;
    checked: boolean;
    disabled: boolean;
}

interface CheckboxPaint {
    box: ViewStyle;
    /** Resolved here because it comes from the same role as the fill it sits on. */
    tickColor: string;
}

/**
 * Box and tick resolve from one role, so an unreadable tick-on-fill is unrepresentable. The
 * outline is the fill colour, not `border`, so the unchecked box previews what checking paints.
 */
const createCheckbox = (theme: AppTheme, options: CheckboxOptions): CheckboxPaint => {
    const { colorVariant, checked, disabled } = options;

    const fill = resolveColor(theme, colorVariant, 'surface');

    return {
        box: {
            ...resolveBoxStyle({
                width: CHECKBOX_SIZE,
                height: CHECKBOX_SIZE,
                radius: '2xs',
                align: 'center',
                justify: 'center',
            }),
            borderWidth: BORDER_WIDTH_MD,
            borderColor: fill,
            backgroundColor: checked ? fill : undefined,
            // Explicit rather than undefined: the pressed style overrides this key, and a
            // dimmed control must not brighten back to full while the finger is down.
            opacity: disabled ? OPACITY_DISABLED : OPACITY_FULL,
        },
        tickColor: resolveColor(theme, colorVariant, 'onSurface'),
    };
};

interface CommonProps {
    style?: never;
    /** A state, not a styling opt-in. No indeterminate option: nothing needs tri-state. */
    checked: boolean;

    /**
     * Required: no option is the majority. Pick a role whose surface reads against the page.
     *
     * The trap is `default`/`surface` on a brand page: both resolve to `card`, which follows the
     * theme, while `backgroundBrand` is navy in both, so the box vanishes in dark mode. The
     * theme-stable surfaces are `accent`, `positive`, `negative` and `brand`.
     */
    colorVariant: ColorVariant;

    testID?: string;
}

const CheckGlyph = ICON_GLYPH.check;

export type CheckboxProps = CommonProps & ({
    /** Receives the value to move to, so `onChange={setAgreeToPrivacy}` is the whole handler. */
    onChange: (checked: boolean) => void;
    /** Required: the control renders no text, so pass the visible label's sentence. */
    accessibilityLabel: string;
    /** Dims the box and stops it taking a press. The two signup sites disable it while busy. */
    disabled?: boolean;
} | {
    /**
     * Left out, the box is a read-only indicator and leaves the accessibility tree entirely:
     * inside an already-`accessible` row, a role here could only be swallowed or double-announced.
     */
    onChange?: never;
    accessibilityLabel?: never;
    /** Nothing to disable: the owning row dims its whole subtree when it is disabled. */
    disabled?: never;
});

/**
 * A checkbox: a square that fills with its colour and shows a tick.
 *
 * Drawn rather than wrapping expo-checkbox, whose tick is a white bitmap that cannot be
 * recoloured and whose unchecked and disabled states are hard-coded greys.
 *
 * No label prop: the real labels contain their own links, and an `accessible` pressable
 * collapses its subtree, so a link inside the box would stop being reachable. The label is the
 * caller's, in a Row beside it, and the accessible name is passed explicitly.
 */
function Checkbox(props: CheckboxProps) {
    const {
        checked,
        colorVariant,
        testID,
        onChange,
        accessibilityLabel,
        disabled = false,
    } = props;

    const { box, tickColor } = useThemedStyles(createCheckbox, {
        colorVariant,
        checked,
        disabled,
    });

    const handlePress = useCallback(
        () => {
            onChange?.(!checked);
        },
        [onChange, checked],
    );

    const resolvePressableStyle = useCallback(
        ({ pressed }: PressableStateCallbackType) => (pressed ? [box, PRESSED_STYLE] : box),
        [box],
    );

    // Not ui/Icon: that one always resolves through the role's `content` slot, correctly, since
    // an icon is normally a foreground on a surface someone else painted. This tick sits on the
    // surface this component just painted, so it has to come from `onSurface`, and no role's
    // `content` is a substitute (nothing has content: 'textOnPrimary', which is what `accent`
    // and `informative` pair with). Both components reach the same glyph table.
    const tick = checked
        ? (
            <CheckGlyph
                // Size must be a prop: react-native-svg lets props win over style.
                size={ICON_SIZE.sm}
                color={tickColor}
            />
        )
        : null;

    if (onChange === undefined) {
        return (
            <View
                style={box}
                testID={testID}
            >
                {tick}
            </View>
        );
    }

    return (
        <Pressable
            testID={testID}
            onPress={handlePress}
            disabled={disabled}
            hitSlop={PRESS_SLOP}
            accessibilityRole="checkbox"
            accessibilityState={{ checked, disabled }}
            accessibilityLabel={accessibilityLabel}
            style={resolvePressableStyle}
        >
            {tick}
        </Pressable>
    );
}

export default Checkbox;
