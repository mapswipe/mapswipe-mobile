import {
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

import useSpacingToken from '@/hooks/useSpacingToken';
import {
    fullSpacings,
    gapSpacings,
    SpacingType,
} from '@/utils/styles';

const styles = StyleSheet.create({
    inlineListView: {
        flexGrow: 1,
        flexDirection: 'row',
    },
    withCenteredContent: {
        justifyContent: 'center',
    },
    withSpaceBetweenContents: {
        justifyContent: 'space-between',
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
    withSpaceBetweenContents?: boolean;

    // FIXME this should not be here
    withAdditionalInlinePadding?: boolean;
    spacingOffset?: number;
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
        withSpaceBetweenContents,
        spacingOffset,
    } = props;

    const spacingStyle = useSpacingToken({
        spacing,
        offset: spacingOffset,
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
                withSpaceBetweenContents && styles.withSpaceBetweenContents,
                !withoutWrap && styles.withWrap,
                style,
            ]}
        >
            {children}
        </View>
    );
}

export default InlineListView;
