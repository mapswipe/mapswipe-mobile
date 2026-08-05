import {
    type KeyboardTypeOptions,
    type ReturnKeyTypeOptions,
    TextInput as NativeTextInput,
    type TextInputProps as NativeTextInputProps,
    type TextStyle,
} from 'react-native';

import Field, { type FieldColorVariant } from '@/components/ui/Field';
import Icon, { type IconName } from '@/components/ui/Icon';
import Row from '@/components/ui/Row';
import {
    type AppTheme,
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import {
    FONT_SIZE_MD,
    FONT_WEIGHT_REGULAR,
} from '@/constants/typography';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';

/**
 * Keyed by FieldColorVariant, so the key doubles as the role Field paints the box with and the
 * two cannot disagree.
 *
 * `text` and `placeholder` are separate because a placeholder in the text's own colour is
 * indistinguishable from a real value.
 */
const FIELD_COLOR = {
    onBrand: { text: 'onBrand', placeholder: 'onBrand' },
    sunken: { text: 'default', placeholder: 'muted' },
} as const satisfies Partial<Record<FieldColorVariant, {
    text: ColorVariant;
    placeholder: ColorVariant;
}>>;

export type TextInputColorVariant = keyof typeof FIELD_COLOR;

interface ContentVariantSpec {
    keyboardType: KeyboardTypeOptions;
    autoCapitalize: NativeTextInputProps['autoCapitalize'];
    autoCorrect: boolean;
    /** `undefined`, not `'off'`: `'off'` actively disables platform autofill. */
    autoComplete: NativeTextInputProps['autoComplete'];
    secureTextEntry: boolean;
    returnKeyType: ReturnKeyTypeOptions | undefined;
    /** Leading affordance drawn inside the field, before the text. */
    iconName: IconName | undefined;
}

const CONTENT_VARIANT = {
    /** Default. The only rung that lets the keyboard capitalise and autocorrect. */
    text: {
        keyboardType: 'default',
        autoCapitalize: 'sentences',
        autoCorrect: true,
        autoComplete: undefined,
        secureTextEntry: false,
        returnKeyType: undefined,
        iconName: undefined,
    },
    email: {
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        autoCorrect: false,
        autoComplete: 'email',
        secureTextEntry: false,
        returnKeyType: undefined,
        iconName: undefined,
    },
    /** Masked. No `autoComplete: 'password'`: enabling password managers is a product call. */
    password: {
        keyboardType: 'default',
        autoCapitalize: 'none',
        autoCorrect: false,
        autoComplete: undefined,
        secureTextEntry: true,
        returnKeyType: undefined,
        iconName: undefined,
    },
    username: {
        keyboardType: 'default',
        autoCapitalize: 'none',
        autoCorrect: false,
        autoComplete: undefined,
        secureTextEntry: false,
        returnKeyType: undefined,
        iconName: undefined,
    },
    /** `returnKeyType: 'search'` is cross-platform, unlike `keyboardType: 'web-search'`. */
    search: {
        keyboardType: 'default',
        autoCapitalize: 'none',
        autoCorrect: false,
        autoComplete: undefined,
        secureTextEntry: false,
        returnKeyType: 'search',
        iconName: 'search-outline',
    },
} as const satisfies Record<string, ContentVariantSpec>;

export type TextInputContentVariant = keyof typeof CONTENT_VARIANT;

/**
 * Three rungs, because a `readOnly` boolean cannot separate two intents: a busy form should
 * read as unavailable, while a value on display should read as ordinary text. Only the first dims.
 */
const EDIT_STATE = {
    /** Default. */
    editable: { readOnly: false, disabled: false },
    /** Not editable, drawn at full strength: a value on display, not a blocked action. */
    readOnly: { readOnly: true, disabled: false },
    /** Not editable and dimmed by Field: the form is busy, or the field is not available. */
    disabled: { readOnly: true, disabled: true },
} as const satisfies Record<string, { readOnly: boolean; disabled: boolean }>;

export type TextInputStateVariant = keyof typeof EDIT_STATE;

/**
 * One text node, so this returns the style itself rather than a StyleSheet, matching ui/Text.
 */
const createInputStyle = (
    theme: AppTheme,
    options: { colorVariant: TextInputColorVariant },
): TextStyle => ({
    // These three are `typeScale.default` minus its lineHeight, written out rather than
    // spread for exactly that reason: a single-line input has one line to space, and Android
    // mis-centres the caret and clips descenders against a TextInput that carries one.
    fontSize: FONT_SIZE_MD,
    fontWeight: FONT_WEIGHT_REGULAR,
    includeFontPadding: false,
    color: resolveColor(theme, FIELD_COLOR[options.colorVariant].text, 'content'),
    // RN gives a TextInput its own internal padding, which would sit inside Field's inset
    // and push the text off the field's baseline. Zero needs no token.
    padding: 0,
    // Take the row beside the leading icon, and shrink rather than push the icon out.
    flexGrow: 1,
    flexShrink: 1,
});

interface CommonProps {
    colorVariant?: TextInputColorVariant;

    /** Defaults to `text`. See CONTENT_VARIANT: this is the keyboard, not the look. */
    contentVariant?: TextInputContentVariant;

    /** Never an accessible name: it is gone by the second keystroke. */
    placeholder?: string;

    value?: string;
    onChangeText?: (value: string) => void;

    /** Defaults to `editable`. Both other rungs reach RN through `readOnly`. */
    stateVariant?: TextInputStateVariant;

    /** Character cap. Not a size token: it counts characters, not pixels. */
    maxLength?: number;

    /** Helper line under the field. Suppressed by `errorText`, which Field decides. */
    hintText?: string;

    /** Error line under the field. */
    errorText?: string;

    testID?: string;
}

/**
 * RN cannot associate a visible label with its field, so the field needs a name of its own:
 * `labelText` becomes it, and a field without one must say what it is.
 */
export type TextInputProps = CommonProps & ({
    labelText: string;
    accessibilityLabel?: never;
} | {
    labelText?: never;
    accessibilityLabel: string;
});

/**
 * A single-line text field: label, hint and error chrome from Field, keyboard from
 * `contentVariant`, colours from one role so the box and its text cannot disagree.
 */
function TextInput(props: TextInputProps) {
    const {
        colorVariant = 'onBrand',
        contentVariant = 'text',
        stateVariant = 'editable',
        placeholder,
        value,
        onChangeText,
        maxLength,
        labelText,
        hintText,
        errorText,
        accessibilityLabel,
        testID,
    } = props;

    const theme = useTheme();
    const inputStyle = useThemedStyles(createInputStyle, { colorVariant });

    const content = CONTENT_VARIANT[contentVariant];
    const editState = EDIT_STATE[stateVariant];
    const { text: textColorVariant, placeholder: placeholderColorVariant } = FIELD_COLOR[
        colorVariant
    ];

    return (
        <Field
            colorVariant={colorVariant}
            labelText={labelText}
            hintText={hintText}
            errorText={errorText}
            disabled={editState.disabled}
        >
            <Row spacing="3xs">
                {content.iconName !== undefined && (
                    <Icon
                        name={content.iconName}
                        sizeVariant="xl"
                        colorVariant={textColorVariant}
                    />
                )}
                <NativeTextInput
                    style={inputStyle}
                    placeholder={placeholder}
                    placeholderTextColor={resolveColor(theme, placeholderColorVariant, 'content')}
                    value={value}
                    onChangeText={onChangeText}
                    readOnly={editState.readOnly}
                    maxLength={maxLength}
                    keyboardType={content.keyboardType}
                    autoCapitalize={content.autoCapitalize}
                    autoCorrect={content.autoCorrect}
                    autoComplete={content.autoComplete}
                    secureTextEntry={content.secureTextEntry}
                    returnKeyType={content.returnKeyType}
                    accessibilityLabel={accessibilityLabel ?? labelText}
                    testID={testID}
                />
            </Row>
        </Field>
    );
}

export default TextInput;
