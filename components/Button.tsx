import useTheme from "@/hooks/useTheme";
import { Pressable, PressableProps, Text } from "react-native";
import InlineListView from "./InlineListView";

interface Props extends PressableProps {
    title?: string;
}

function Button(props: Props) {
    const { title, ...pressableProps } = props;

    const theme = useTheme();

    return (
        <Pressable {...pressableProps}>
            <InlineListView
                spacing="3xs"
                withCenteredContent
                style={{
                    borderColor: theme.primaryDark,
                    backgroundColor: theme.primary,
                    borderWidth: 1,
                    borderRadius: 20,
                    flexShrink: 0,
                    flexGrow: 0,
                }}
                withPadding
                withAdditionalInlinePadding
                withoutOpticalCorrection
            >
                <Text 
                    style={{
                        color: theme.textOnPrimary,
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
