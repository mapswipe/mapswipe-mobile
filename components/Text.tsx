import { useMemo } from 'react';
import {
    StyleSheet,
    Text as NativeText,
    TextStyle,
} from 'react-native';

import {
    FONT_SIZE_3XL,
    FONT_SIZE_LG,
    FONT_SIZE_MD,
    FONT_SIZE_SM,
} from '@/constants/dimensions';
import useTheme from '@/hooks/useTheme';

interface Props {
    children: string | null | undefined;
    style?: TextStyle;
    variant?: 'default' | 'heading' | 'title' | 'label' | 'description';
}

function Text(props: Props) {
    const {
        style,
        children,
        variant = 'default',
    } = props;

    const theme = useTheme();

    const styles = useMemo(() => (
        StyleSheet.create({
            heading: {
                fontSize: FONT_SIZE_3XL,
                fontWeight: 'bold',
                color: theme.textPrimary,
            },
            title: {
                fontSize: FONT_SIZE_LG,
                fontWeight: 'bold',
                color: theme.textPrimary,
            },
            label: {
                fontSize: FONT_SIZE_SM,
                fontWeight: 'medium',
                color: theme.textSecondary,
            },
            description: {
                fontSize: FONT_SIZE_MD,
                fontWeight: 'regular',
                color: theme.textSecondary,
            },
        })
    ), [theme]);

    return (
        <NativeText
            style={[
                variant === 'heading' && styles.heading,
                variant === 'title' && styles.title,
                variant === 'label' && styles.label,
                variant === 'description' && styles.description,
                style,
            ]}
        >
            {children}
        </NativeText>
    );
}

export default Text;
