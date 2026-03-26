import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { isDefined } from '@togglecorp/fujs';

import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import Icon, { type IconName } from './Icon';
import InlineListView, { type Props as InlineLayoutProps } from './InlineListView';

export type ButtonColorVariant = 'primaryBlue' | 'primaryGreen' | 'primaryRed' | 'success' | 'danger' | 'info' | 'card';
export type ButtonStyleVariant = 'outline' | 'filled' | 'transparent' | 'block' | 'underline' | 'action';

const VARIANT_COLOR: Record<ButtonColorVariant, keyof AppTheme> = {
    primaryBlue: 'primaryBlue',
    primaryGreen: 'primaryGreen',
    primaryRed: 'primaryRed',
    success: 'success',
    danger: 'error',
    info: 'info',
    card: 'card',
};

const createStyles = (
    theme: AppTheme,
    options: {
        colorVariant: ButtonColorVariant,
        styleVariant: ButtonStyleVariant,
        fullWidth: boolean;
    },
) => {
    const { colorVariant, styleVariant, fullWidth } = options;

    const variantColor = theme[VARIANT_COLOR[colorVariant]] as string;

    let backgroundColor: string;
    let borderColor: string;
    let textColor: string;

    switch (styleVariant) {
        case 'filled':
            backgroundColor = variantColor;
            borderColor = variantColor;
            textColor = theme.textOnPrimary;
            break;
        case 'transparent':
            backgroundColor = 'transparent';
            borderColor = 'transparent';
            textColor = variantColor;
            break;
        case 'block':
            backgroundColor = theme.card;
            borderColor = 'transparent';
            textColor = variantColor;
            break;
        case 'action':
            backgroundColor = 'transparent';
            borderColor = 'transparent';
            textColor = variantColor;
            break;
        case 'outline':
        default:
            backgroundColor = 'transparent';
            borderColor = variantColor;
            textColor = variantColor;
            break;
    }

    return StyleSheet.create({
        buttonLayout: {
            flexDirection: 'row',
            alignItems: 'center',
            width: fullWidth ? '100%' : undefined,
        },
        text: {
            fontWeight: styleVariant === 'block' ? 'normal' : 'bold',
            textTransform: styleVariant !== 'underline' ? 'capitalize' : undefined,
            color: textColor,
            textDecorationLine: styleVariant === 'underline' ? 'underline' : undefined,
        },
        icon: {
            color: textColor,
            height: 14,
            width: 14,
        },
        touchable: {
            width: fullWidth ? '100%' : undefined,
            borderWidth: (styleVariant === 'underline' || styleVariant === 'action' || styleVariant === 'block') ? undefined : 2,
            borderColor,
            borderRadius: styleVariant === 'block' ? 0 : 6,
            backgroundColor,
        },
        disabled: {
            opacity: 0.4,
        },
        rightContent: {
            marginLeft: 'auto',
        },
    });
};

export interface ButtonLayoutProps extends Omit<InlineLayoutProps, 'withPadding' | 'children'> {
    colorVariant?: ButtonColorVariant;
    styleVariant?: ButtonStyleVariant;
    withoutPadding?: boolean;
    disabled?: boolean;
    iconName?: IconName;
    title?: string;
    fullWidth?: boolean;
    onPress?: () => void;
    children?: React.ReactNode;
    action?: React.ReactNode
    accessibilityLabel?: string;
}

function ButtonLayout(props: ButtonLayoutProps) {
    const {
        colorVariant = 'primaryBlue',
        styleVariant = 'filled',
        spacingOffset = -1,
        withoutPadding = false,
        disabled,
        iconName,
        title,
        onPress,
        spacing = 'sm',
        fullWidth = true,
        action,
        children,
        accessibilityLabel,
        ...inlineLayoutProps
    } = props;

    const styles = useThemedStyles(
        createStyles,
        {
            colorVariant,
            styleVariant,
            fullWidth,
        },
    );

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
            style={[
                styles.touchable,
                disabled && styles.disabled,
            ]}
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityRole="button"
        >
            <InlineListView
                withPadding={styleVariant === 'underline' ? false : !withoutPadding}
                style={[
                    styles.buttonLayout,
                ]}
                spacingOffset={spacingOffset}
                spacing={spacing}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...inlineLayoutProps}
                withCenteredContent={styleVariant !== 'block'}
            >
                {isDefined(iconName) && (
                    <Icon
                        style={styles.icon}
                        name={iconName}
                    />
                )}
                {title && (
                    <Text style={styles.text}>
                        {title}
                    </Text>
                )}
                {children}
                {action && <View style={styles.rightContent}>{action}</View>}
            </InlineListView>
        </TouchableOpacity>
    );
}

export default ButtonLayout;
