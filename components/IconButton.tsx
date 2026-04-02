import { useCallback } from 'react';
import {
    Pressable,
    PressableProps,
    StyleSheet,
} from 'react-native';

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
        ...pressableProps
    } = props;

    const handlePress = useCallback(() => {
        onPress?.(name);
    }, [name, onPress]);

    const styles = useThemedStyles(
        createStyles,
        { active, tintColor, disabled: disabled ?? undefined },
    );

    return (
        <BlockListView
            spacing="2xs"
            withCenteredContent
        >
            <Pressable
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...pressableProps}
                onPress={handlePress}
                disabled={disabled}
                style={styles.button}
            >
                <Icon
                    name={iconName}
                    color="#ffffff"
                />
            </Pressable>
            <Text
                colorVariant={textColorVariant}
            >
                {title}
            </Text>
        </BlockListView>
    );
}

export default IconButton;
