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

/**
 * A designed inset is a spacing rung, a measured one a number. Both are needed, and they cannot
 * be confused, because a rung is a string.
 */
type Inset = SpacingType | number;

function resolveInset(inset: Inset | undefined): number | undefined {
    if (inset === undefined) {
        return undefined;
    }

    return typeof inset === 'number' ? inset : getSpacingValue(inset);
}

// `display`, not `opacity`: an anchored box is out of flow, so removing it reflows nothing,
// and unlike conditional rendering it leaves the subtree mounted.
const hiddenStyle: ViewStyle = { display: 'none' };

export interface PositionedProps {
    children?: ReactNode;

    /**
     * Required: every rung emits position: absolute, so a Positioned is never accidentally in
     * flow. The stretching rungs pin both inline edges, giving extent without a width.
     */
    anchor: AnchorType;

    /**
     * Inset on every edge the anchor pins. Negative values overhang the parent, which is how
     * a corner badge sits proud of the icon it counts.
     */
    offset?: Inset;
    offsetBlock?: Inset;
    offsetInline?: Inset;

    /**
     * Measured geometry, as numbers: a slot height from onLayout, a tile width divided out of
     * the viewport. A designed size is a token the caller reads and passes as its number.
     */
    width?: number;
    height?: number;

    /** How the box places its own content, e.g. a control bottom-anchored inside a tall bar. */
    align?: AlignType;
    justify?: JustifyType;

    /** The box's own content inset. Rhythm between children belongs to Stack and Row. */
    padding?: SpacingType;
    paddingInline?: SpacingType;
    paddingBlockEnd?: SpacingType;

    /**
     * Stacking rung. zIndex and Android's elevation move together, because elevation can
     * outrank zIndex there and leave a lifted overlay underneath its siblings.
     */
    layer?: LayerType;

    /** Out of layout, children still mounted. */
    hidden?: boolean;

    /** An overlay that eats touches meant for the map or tile under it is a bug. */
    pointerEvents?: ViewProps['pointerEvents'];
}

/** Anchored box. Every position: absolute in the app resolves through this. */
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
