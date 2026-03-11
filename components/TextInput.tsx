import {
    StyleSheet,
    TextInput as RawTextInput,
    TextInputProps,
} from 'react-native';

import InputContainerLayout, {
    type Props as InputContainerLayoutProps,
    type StyleVariant,
} from '@/components/InputContainerLayout';
import { type AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = (theme: AppTheme, { variant }: { variant: StyleVariant }) => (
    StyleSheet.create({
        textInput: {
            color: variant === 'brand' ? theme.textOnBrand : theme.textPrimary,
        },
    })
);

interface Props extends TextInputProps, Omit<InputContainerLayoutProps, 'input'> {
}

function TextInput(props: Props) {
    const {
        variant = 'brand',
        errorText,
        labelText,
        hintText,
        ...otherProps
    } = props;
    const styles = useThemedStyles(createStyles, { variant });
    const theme = useTheme();

    return (
        <InputContainerLayout
            errorText={errorText}
            labelText={labelText}
            hintText={hintText}
            variant={variant}
            input={(
                <RawTextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={variant === 'brand' ? '#fff' : theme.textMuted}
                    style={styles.textInput}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...otherProps}
                />
            )}
        />
    );
}

export default TextInput;
