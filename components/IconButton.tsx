import { useCallback } from 'react';
import {
    Pressable,
    PressableProps,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { isDefined } from '@togglecorp/fujs';

import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import BlockListView from './BlockListView';
import Icon, { type IconName } from './Icon';
import Text from './Text';

interface Props<NAME> extends Omit<PressableProps, 'onPress'> {
    name: NAME;
    title?: string;
    onPress?: (name: NAME) => void;
    iconName: IconName;
    tintColor?: string;
    active?: boolean;
    textColorVariant?: 'brand' | 'normal';
    stylesContainer?: ViewStyle | ViewStyle[];
    stylesButton?: ViewStyle | ViewStyle[];
    size?: string | number;
}

const createStyles = (theme: AppTheme, { active, tintColor, disabled }:
    { active?: boolean; tintColor?: string; disabled?: boolean }) => StyleSheet.create({
    button: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: tintColor,
        opacity: disabled ? 0.5 : 1,
        width: 50,
        aspectRatio: 1,
        borderRadius: '50%',
        outlineStyle: 'dashed',
        outlineOffset: 3,
        outlineColor: active ? theme.card : 'transparent',
        outlineWidth: active ? 4 : undefined,
        includeFontPadding: false,
    },
});

function IconButton<const NAME>(props: Props<NAME>) {
    const {
        name,
        title,
        onPress,
        disabled,
        iconName,
        tintColor,
        active,
        textColorVariant,
        stylesContainer,
        stylesButton,
        size,
        ...pressableProps
    } = props;

    const handlePress = useCallback(() => {
        onPress?.(name);
    }, [name, onPress]);

    const styles = useThemedStyles(
        createStyles,
        { active, tintColor, disabled: disabled ?? undefined },
    );

    const normalizedButtonStyles = Array.isArray(stylesButton) ? stylesButton : [stylesButton];

    return (
        <BlockListView
            spacing="2xs"
            withCenteredContent
            style={stylesContainer}
        >
            <Pressable
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...pressableProps}
                onPress={handlePress}
                disabled={disabled}
                style={[styles.button, ...normalizedButtonStyles]}
            >
                <Icon
                    name={iconName}
                    color="#ffffff"
                    size={size}
                />
            </Pressable>
            {isDefined(title) && (
                <Text
                    colorVariant={textColorVariant}
                >
                    {title}
                </Text>
            ) }

        </BlockListView>
    );
}

export default IconButton;
