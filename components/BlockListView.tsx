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
    withCenteredContent: {
        alignItems: 'center',
    },
});

interface Props {
    children: React.ReactNode;
    spacing?: SpacingType;
    style?: ViewStyle | ViewStyle[];
    withPadding?: boolean;
    withCenteredContent?: boolean;
}

function BlockListView(props: Props) {
    const {
        children,
        style = {},
        spacing,
        withPadding,
        withCenteredContent,
    } = props;

    const spacingStyle = useSpacingToken({
        spacing,
        modes: withPadding ? fullSpacings : gapSpacings,
    });

    return (
        <View
            style={[
                spacingStyle,
                withCenteredContent && styles.withCenteredContent,
                ...(Array.isArray(style) ? style : [style]),
            ]}
        >
            {children}
        </View>
    );
}

export default BlockListView;
