import { type ReactNode } from 'react';
import {
    View,
    type ViewProps,
    type ViewStyle,
} from 'react-native';

import {
    layers,
    type LayerType,
} from '@/constants/layer';
import {
    type AlignType,
    type AnchorType,
    type JustifyType,
    resolveBoxStyle,
} from '@/utils/layout';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

type Inset = SpacingType | number;

function resolveInset(inset: Inset | undefined): number | undefined {
    if (inset === undefined) {
        return undefined;
    }

    return typeof inset === 'number' ? inset : getSpacingValue(inset);
}

// `display`, not conditional rendering: it hides the box but leaves the subtree mounted.
const hiddenStyle: ViewStyle = { display: 'none' };

export interface PositionedProps {
    style?: never;
    children?: ReactNode;

    /** Every anchor emits position: absolute, so a Positioned is never in flow. */
    anchor: AnchorType;

    /** Inset on every edge the anchor pins. Negative values overhang the parent. */
    offset?: Inset;
    offsetBlock?: Inset;
    offsetInline?: Inset;

    width?: number;
    height?: number;

    align?: AlignType;
    justify?: JustifyType;

    padding?: SpacingType;
    paddingInline?: SpacingType;
    paddingBlockEnd?: SpacingType;

    /** Android's elevation can outrank zIndex, so both move together. */
    layer?: LayerType;

    hidden?: boolean;

    pointerEvents?: ViewProps['pointerEvents'];
}

function Positioned(props: PositionedProps) {
    const {
        children,
        anchor,
        offset,
        offsetBlock,
        offsetInline,
        width,
        height,
        align,
        justify,
        padding,
        paddingInline,
        paddingBlockEnd,
        layer,
        hidden,
        pointerEvents,
    } = props;

    const layerStyle: ViewStyle | undefined = layer === undefined
        ? undefined
        : { zIndex: layers[layer], elevation: layers[layer] };

    return (
        <View
            style={[
                resolveBoxStyle({
                    anchor,
                    offset: resolveInset(offset),
                    offsetBlock: resolveInset(offsetBlock),
                    offsetInline: resolveInset(offsetInline),
                    width,
                    height,
                    align,
                    justify,
                    padding: resolveInset(padding),
                    paddingInline: resolveInset(paddingInline),
                    paddingBlockEnd: resolveInset(paddingBlockEnd),
                }),
                layerStyle,
                hidden && hiddenStyle,
            ]}
            pointerEvents={pointerEvents}
        >
            {children}
        </View>
    );
}

export default Positioned;
