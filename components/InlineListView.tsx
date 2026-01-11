import useSpacingToken from "@/hooks/useSpacingToken";
import { fullSpacings, gapSpacings, SpacingType } from "@/utils/styles";
import { StyleSheet, View, ViewStyle } from "react-native";

const styles = StyleSheet.create({
    inlineListView: {
        flexGrow: 1,
        flexDirection: 'row',
    },
    withCenteredContent: {
        justifyContent: 'center',
    },
    withWrap: {
        flexWrap: 'wrap',
    },
});

interface Props {
    children: React.ReactNode;
    spacing?: SpacingType;
    style?: ViewStyle;
    withPadding?: boolean;
    withCenteredContent?: boolean;
    withoutWrap?: boolean;
    withoutOpticalCorrection?: boolean;

    // FIXME this should not be here
    withAdditionalInlinePadding?: boolean;
}

function InlineListView(props: Props) {
    const {
        children,
        style,
        spacing,
        withPadding,
        withCenteredContent,
        withoutWrap,
        withoutOpticalCorrection,
        withAdditionalInlinePadding,
    } = props;

    const spacingStyle = useSpacingToken({
        spacing,
        modes: withPadding ? fullSpacings : gapSpacings,
        withoutOpticalCorrection,
        withAdditionalInlinePadding,
    });

    return (
        <View
            style={[
                spacingStyle,
                styles.inlineListView,
                withCenteredContent && styles.withCenteredContent,
                !withoutWrap && styles.withWrap,
                style,
            ]}
        >
            {children}
        </View>
    );
}

export default InlineListView;
