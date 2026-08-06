import {
    type ReactNode,
    useCallback,
    useState,
} from 'react';
import {
    View,
    type ViewStyle,
} from 'react-native';
import { isTruthyString } from '@togglecorp/fujs';

import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { BORDER_WIDTH_THIN } from '@/constants/border';
import {
    OPACITY_DISABLED,
    OPACITY_FULL,
} from '@/constants/opacity';
import { type RadiusType } from '@/constants/radius';
import { TOUCH_TARGET_MIN } from '@/constants/size';
import {
    type AppTheme,
    type ColorRole,
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

export type FieldColorVariant = Extract<ColorVariant, 'default' | 'sunken' | 'onBrand'>;

const FIELD_SURFACE = {
    default: 'card',
    sunken: 'backgroundMuted',
    onBrand: 'inputBrandBackground',
} as const satisfies Record<FieldColorVariant, ThemeColorKey>;

interface FieldStateOutline {
    /** Left undefined to take the field's own role: the outline belongs to the surface. */
    colorVariant: ColorVariant | undefined;
    slot: keyof ColorRole;
    dimmed: boolean;
}

/**
 * Only the outline and the dimming move; the surface stays put.
 *
 * `focused` uses `onSurface`, the one slot guaranteed legible against `surface`: brand navy on
 * a brand field would be an invisible ring. `errored` is the only state that leaves the role.
 */
const FIELD_STATE = {
    default: { colorVariant: undefined, slot: 'border', dimmed: false },
    focused: { colorVariant: undefined, slot: 'onSurface', dimmed: false },
    errored: { colorVariant: 'negative', slot: 'content', dimmed: false },
    disabled: { colorVariant: undefined, slot: 'border', dimmed: true },
} as const satisfies Record<string, FieldStateOutline>;

export type FieldStateType = keyof typeof FIELD_STATE;

/** 12, where the box used an untokenised 14. The hairline is inside, so the height is unchanged. */
const CONTAINER_PADDING = '2xs' satisfies SpacingType;

/** 8, not 16: forms gap their fields by 24, and 16 inside that does not read as grouping. */
const FIELD_GAP = '3xs' satisfies SpacingType;

/** 6, the radius the box already draws, as a token rather than a literal. */
const CONTAINER_RADIUS = 'xs' satisfies RadiusType;

interface FieldStateFlags {
    disabled: boolean;
    errored: boolean;
    focused: boolean;
}

/**
 * Precedence, strongest first. Errored outranks focused: a focus ring replacing the error
 * would hide the complaint exactly while it is being acted on.
 */
function resolveFieldState(flags: FieldStateFlags): FieldStateType {
    const { disabled, errored, focused } = flags;

    if (disabled) {
        return 'disabled';
    }

    if (errored) {
        return 'errored';
    }

    if (focused) {
        return 'focused';
    }

    return 'default';
}

interface FieldStyleOptions {
    colorVariant: FieldColorVariant;
    state: FieldStateType;
}

interface FieldStyles {
    root: ViewStyle;
    container: ViewStyle;
}

// Plain objects: useThemedStyles already memoises per theme and per option.
const createStyles = (theme: AppTheme, options: FieldStyleOptions): FieldStyles => {
    const { colorVariant, state } = options;

    const outline = FIELD_STATE[state];

    return {
        // The whole field dims, not just the box: a disabled field whose label and hint
        // stayed at full strength reads as an enabled one that has merely greyed its border.
        root: { opacity: outline.dimmed ? OPACITY_DISABLED : OPACITY_FULL },
        container: {
            ...resolveBoxStyle({
                padding: getSpacingValue(CONTAINER_PADDING),
                // The box is the touch target that focuses the control inside it, so it owes
                // the platform minimum even when the control is shorter than one line.
                minHeight: TOUCH_TARGET_MIN,
                justify: 'center',
                radius: CONTAINER_RADIUS,
            }),
            backgroundColor: theme[FIELD_SURFACE[colorVariant]],
            borderColor: resolveColor(theme, outline.colorVariant ?? colorVariant, outline.slot),
            // Constant across every state, so focusing never reflows the box: RN draws a
            // border on the inside, so a state that thickened it would shift the text.
            borderWidth: BORDER_WIDTH_THIN,
        },
    };
};

export interface FieldProps {
    style?: never;
    /** Any subtree: focus arrives as a bubbled event, so nothing has to cooperate. */
    children: ReactNode;

    /** Which role paints the box. Defaults to `default`, the neutral card surface. */
    colorVariant?: FieldColorVariant;

    /**
     * An empty string counts as absent, which is what a translation miss produces. Not an
     * accessible name: RN cannot associate a sibling Text with a control.
     */
    labelText?: string;

    /** Sits below the box, at `caption`. Suppressed while there is an error. */
    hintText?: string;

    errorText?: string;

    /** A state, not a styling opt-in, hence not `withDisabled`. */
    disabled?: boolean;

    testID?: string;
}

/**
 *
 * Focus needs no ref, cloneElement or slot contract: RN registers topFocus and topBlur as
 * bubbling events, so a control anywhere in the subtree reaches the box's own handlers.
 */
function Field(props: FieldProps) {
    const {
        children,
        colorVariant = 'default',
        labelText,
        hintText,
        errorText,
        disabled = false,
        testID,
    } = props;

    const [focused, setFocused] = useState(false);

    const handleFocus = useCallback(() => {
        setFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setFocused(false);
    }, []);

    const errored = isTruthyString(errorText);

    const supportingText = errored ? errorText : hintText;

    const state = resolveFieldState({ disabled, errored, focused });

    const styles = useThemedStyles(createStyles, { colorVariant, state });

    return (
        <View
            style={styles.root}
            testID={testID}
        >
            <Stack spacing={FIELD_GAP}>
                {isTruthyString(labelText) && (
                    <Text
                        variant="label"
                        colorVariant={colorVariant}
                    >
                        {labelText}
                    </Text>
                )}
                <View
                    style={styles.container}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                >
                    {children}
                </View>
                {isTruthyString(supportingText) && (
                    <Text
                        variant="caption"
                        // The message keeps the field's own role while it is a hint, so it
                        // stays legible on the brand navy, where `muted` would not be.
                        colorVariant={errored ? 'negative' : colorVariant}
                    >
                        {supportingText}
                    </Text>
                )}
            </Stack>
        </View>
    );
}

export default Field;
