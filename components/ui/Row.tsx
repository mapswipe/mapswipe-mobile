import { View } from 'react-native';

import useSpacingToken from '@/hooks/useSpacingToken';
import {
    type AlignType,
    type JustifyType,
    resolveBoxStyle,
} from '@/utils/layout';
import {
    gapSpacings,
    paddingSpacings,
    type SpacingType,
} from '@/utils/styles';

export interface RowProps {
    style?: never;
    children: React.ReactNode;
    /** Required on purpose: an unspecified gap is how inconsistent rhythm gets in. */
    spacing: SpacingType;
    padding?: SpacingType;
    /**
     * Defaults to 'center', because a row of mixed-height content almost always wants its
     * items centred on the block axis. Pass 'stretch' for flexbox's own default.
     */
    align?: AlignType;
    justify?: JustifyType;
    grow?: boolean;
    wrap?: boolean;
    testID?: string;
}

/** Horizontal row. */
function Row(props: RowProps) {
    const {
        children,
        spacing,
        padding,
        align = 'center',
        justify,
        grow = false,
        wrap,
        testID,
    } = props;

    const gapStyle = useSpacingToken({ spacing, modes: gapSpacings });
    const paddingStyle = useSpacingToken({ spacing: padding, modes: paddingSpacings });

    return (
        <View
            testID={testID}
            style={[
                gapStyle,
                padding !== undefined && paddingStyle,
                resolveBoxStyle({
                    direction: 'row',
                    align,
                    justify,
                    wrap,
                    grow: grow ? 1 : undefined,
                }),
            ]}
        >
            {children}
        </View>
    );
}

export default Row;
