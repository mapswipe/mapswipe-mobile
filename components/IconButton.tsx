import { useCallback } from 'react';
import {
    Pressable,
    PressableProps,
} from 'react-native';

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
                style={{
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
                    outlineColor: active ? '#ffffff' : 'transparent',
                    outlineWidth: active ? 4 : undefined,
                }}
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
