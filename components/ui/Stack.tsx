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

const growStyles = {
    slot: { flex: 1, minHeight: 0 },
    fill: { flex: 1 },
} as const;

export type GrowType = keyof typeof growStyles;

export interface StackProps {
    style?: never;
    children: React.ReactNode;
    /** Required on purpose: an unspecified gap is how inconsistent rhythm gets in. */
    spacing: SpacingType;
    padding?: SpacingType;
    align?: AlignType;
    justify?: JustifyType;
    grow?: GrowType;
    wrap?: boolean;
    testID?: string;
}

/**
 * Vertical stack. It deliberately does not set flexDirection: column is a View's default, so
 * emitting it would add a redundant key to every resolved style for no behavioural gain.
 */
function Stack(props: StackProps) {
    const {
        children,
        spacing,
        padding,
        align,
        justify,
        grow,
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
                    align,
                    justify,
                    wrap,
                }),
                grow !== undefined && growStyles[grow],
            ]}
        >
            {children}
        </View>
    );
}

export default Stack;
