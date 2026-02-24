import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import { isDefined } from '@togglecorp/fujs';

import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import Icon, { type IconName } from './Icon';
import InlineListView, { type Props as InlineLayoutProps } from './InlineListView';

export type ButtonColorVariant = 'primaryBlue' | 'primaryGreen' | 'primaryRed' | 'success' | 'danger';
export type ButtonStyleVariant = 'outline' | 'filled' | 'transparent' | 'block';

const VARIANT_COLOR: Record<ButtonColorVariant, keyof AppTheme> = {
    primaryBlue: 'primaryBlue',
    primaryGreen: 'primaryGreen',
    primaryRed: 'primaryRed',
    success: 'success',
    danger: 'error',
};

const createStyles = (
    theme: AppTheme,
    options: {
        colorVariant: ButtonColorVariant,
        styleVariant: ButtonStyleVariant,
    },
) => {
    const { colorVariant, styleVariant } = options;

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
            backgroundColor = theme.background;
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
            borderWidth: 2,
            borderColor,
            borderRadius: 6,
            width: '100%',
            backgroundColor,
        },
        text: {
            fontWeight: styleVariant === 'block' ? 'normal' : 'bold',
            textTransform: 'capitalize',
            color: textColor,
        },
        icon: {
            color: textColor,
            height: 14,
            width: 14,
        },
        touchable: {
            width: '100%',
        },
        disabled: {
            opacity: 0.4,
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
    onPress?: () => void;
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
        ...inlineLayoutProps
    } = props;

    const styles = useThemedStyles(
        createStyles,
        {
            colorVariant,
            styleVariant,
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
        >
            <InlineListView
                withPadding={!withoutPadding}
                spacingOffset={spacingOffset}
                style={[
                    styles.buttonLayout,
                ]}
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
                <Text style={styles.text}>
                    {title}
                </Text>
            </InlineListView>
        </TouchableOpacity>
    );
}

export default ButtonLayout;
