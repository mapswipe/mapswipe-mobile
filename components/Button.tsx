import useTheme from "@/hooks/useTheme";
import { Pressable, PressableProps, Text } from "react-native";
import InlineListView from "./InlineListView";
import { useCallback } from "react";
import Icon from "./Icon";
import { isDefined } from "@togglecorp/fujs";

interface Props<NAME> extends Omit<PressableProps, 'onPress'> {
    name: NAME;
    title?: string;
    onPress?: (name: NAME) => void;
    iconName?: string;
}

function Button<const NAME>(props: Props<NAME>) {
    const {
        name,
        title,
        onPress,
        disabled,
        iconName,
        ...pressableProps
    } = props;

    const theme = useTheme();

    const handlePress = useCallback(() => {
        onPress?.(name);
    }, [name, onPress]);

    return (
        <Pressable
            {...pressableProps}
            onPress={handlePress}
            disabled={disabled}
        >
            <InlineListView
                spacing="3xs"
                withCenteredContent
                style={{
                    borderColor: theme.primaryDark,
                    backgroundColor: theme.surface,
                    borderWidth: 1,
                    borderRadius: 20,
                    flexShrink: 0,
                    flexGrow: 0,
                    opacity: disabled ? 0.5 : 1,
                }}
                withPadding
                withAdditionalInlinePadding
                withoutOpticalCorrection
            >
                {isDefined(iconName) && (
                    <Icon name={iconName} />
                )}
                <Text 
                    style={{
                        // color: theme.textOnPrimary,
                        textTransform: 'uppercase',
                    }}
                >
                    {title}
                </Text>
            </InlineListView>
        </Pressable>
    );
}

export default Button;
