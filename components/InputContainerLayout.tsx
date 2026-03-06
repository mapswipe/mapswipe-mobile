import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import {
    isFalsyString,
    isTruthyString,
} from '@togglecorp/fujs';

import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import BlockListView from './BlockListView';

export type StyleVariant = 'brand' | 'normal';

const createStyles = (theme: AppTheme, { variant } : { variant: StyleVariant }) => (
    StyleSheet.create({
        inputContainerLayout: {
            flexGrow: 1,
            backgroundColor: variant === 'brand' ? theme.inputBrandBackground : theme.backgroundMuted,
            padding: 14,
            borderRadius: 6,
        },
        label: {
            color: variant === 'brand' ? theme.textOnBrand : theme.textPrimary,
            textTransform: 'uppercase',
            fontSize: 10,
        },
        hint: {
            color: variant === 'brand' ? theme.textOnBrand : theme.textPrimary,
        },
        error: {
            color: theme.error,
        },
    })
);

export interface Props {
    variant?: StyleVariant;
    input: React.ReactNode;
    labelText?: string;
    errorText?: string;
    hintText?: string;
}

function InputContainerLayout(props: Props) {
    const {
        labelText,
        input,
        errorText,
        variant = 'brand',
        hintText,
    } = props;

    const styles = useThemedStyles(createStyles, { variant });

    return (
        <BlockListView
            spacing="xs"
        >
            {isTruthyString(labelText) && (
                <Text style={styles.label}>
                    {labelText}
                </Text>
            )}
            <View style={styles.inputContainerLayout}>
                {input}
            </View>
            {isTruthyString(errorText) && (
                <Text style={styles.error}>
                    {errorText}
                </Text>
            )}
            {isFalsyString(errorText) && isTruthyString(hintText) && (
                <Text style={styles.hint}>
                    {hintText}
                </Text>
            )}
        </BlockListView>
    );
}

export default InputContainerLayout;
