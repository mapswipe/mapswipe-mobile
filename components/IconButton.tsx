import { Pressable, PressableProps } from "react-native";

import Icon from "./Icon";
import { useCallback } from "react";
import BlockListView from "./BlockListView";
import Text from "./Text";

interface Props<NAME> extends Omit<PressableProps, 'onPress'> {
    name: NAME;
    title?: string;
    onPress?: (name: NAME) => void;
    iconName: string;
    tintColor?: string;
    active?: boolean;
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
                    outlineColor: active ? '#000000' : 'transparent',
                    outlineWidth: active ? 4 : undefined,
                }}
            >
                <Icon
                    name={iconName}
                    color="#ffffff"
                />
            </Pressable>
            <Text>
                {title}
            </Text>
        </BlockListView>
    );
}

export default IconButton;
