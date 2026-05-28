import { useMemo } from 'react';
import {
    GestureResponderEvent,
    StyleSheet,
    Text as NativeText,
    TextStyle,
} from 'react-native';

import {
    FONT_SIZE_2XL,
    FONT_SIZE_LG,
    FONT_SIZE_MD,
    FONT_SIZE_SM,
} from '@/constants/dimensions';
import useTheme from '@/hooks/useTheme';

export type colorVariant = 'normal' | 'brand'

interface Props {
    children: string | null | undefined | React.ReactNode;
    style?: TextStyle;
    variant?: 'default' | 'heading' | 'title' | 'label' | 'description';
    onPress?: (event: GestureResponderEvent) => void;
    colorVariant?: colorVariant;
}

function Text(props: Props) {
    const {
        style,
        children,
        colorVariant = 'normal',
        variant = 'default',
        onPress,
    } = props;

    const theme = useTheme();

    const styles = useMemo(() => (
        StyleSheet.create({
            heading: {
                fontSize: FONT_SIZE_2XL,
                fontWeight: 'bold',
                color: theme.textPrimary,
                includeFontPadding: false,
            },
            title: {
                fontSize: FONT_SIZE_LG,
                fontWeight: 'bold',
                color: theme.textPrimary,
                includeFontPadding: false,
            },
            label: {
                fontSize: FONT_SIZE_SM,
                fontWeight: 'medium',
                color: theme.textSecondary,
                includeFontPadding: false,
            },
            description: {
                fontSize: FONT_SIZE_MD,
                fontWeight: 'regular',
                color: theme.textSecondary,
                includeFontPadding: false,
            },
            brand: {
                color: theme.textOnBrand,
                includeFontPadding: false,
            },
        })
    ), [theme]);

    return (
        <NativeText
            onPress={onPress}
            style={[
                variant === 'heading' && styles.heading,
                variant === 'title' && styles.title,
                variant === 'label' && styles.label,
                variant === 'description' && styles.description,
                colorVariant === 'brand' && styles.brand,
                style,
            ]}
        >
            {children}
        </NativeText>
    );
}

export default Text;
