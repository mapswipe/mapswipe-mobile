import {
    StyleSheet,
    TextInput as RawTextInput,
    TextInputProps,
} from 'react-native';

import InputContainerLayout from '@/components/InputContainerLayout';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

type StyleVariant = 'normal' | 'brand';

const createStyles = (theme: AppTheme, { variant } : { variant: StyleVariant }) => (
    StyleSheet.create({
        textInput: {
            color: variant === 'brand' ? theme.textOnBrand : theme.textPrimary,
        },
    })
);

interface Props extends TextInputProps {
    variant?: StyleVariant;
}

function TextInput(props: Props) {
    const {
        variant = 'brand',
        ...otherProps
    } = props;
    const styles = useThemedStyles(createStyles, { variant });

    return (
        <InputContainerLayout
            input={(
                <RawTextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholderTextColor={variant === 'brand' ? '#fff' : '#000'}
                    style={styles.textInput}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...otherProps}
                />
            )}
        />
    );
}

export default TextInput;
