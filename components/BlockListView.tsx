import useSpacingToken from "@/hooks/useSpacingToken";
import { fullSpacings, gapSpacings, SpacingType } from "@/utils/styles";
import { View, ViewStyle } from "react-native";

interface Props {
    children: React.ReactNode;
    spacing?: SpacingType;
    style?: ViewStyle;
    withPadding?: boolean;
}

function BlockListView(props: Props) {
    const {
        children,
        style = {},
        spacing,
        withPadding,
    } = props;

    const spacingStyle = useSpacingToken({
        spacing,
        modes: withPadding ? fullSpacings : gapSpacings,
    });

    return (
        <View
            style={[
                spacingStyle,
                style,
            ]}
        >
            {children}
        </View>
    );
}

export default BlockListView;
