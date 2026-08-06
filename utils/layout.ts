import { ViewStyle } from 'react-native';

import {
    RADIUS,
    RadiusType,
} from '@/constants/radius';

const alignValues = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
} as const;

export type AlignType = keyof typeof alignValues;

const justifyValues = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
} as const;

export type JustifyType = keyof typeof justifyValues;

const directionValues = {
    row: 'row',
    column: 'column',
} as const;

export type DirectionType = keyof typeof directionValues;

// 'stretch' pins both edges, so the box spans the parent on that axis.
const anchorEdges = {
    topStart: { block: 'start', inline: 'start' },
    topEnd: { block: 'start', inline: 'end' },
    bottomStart: { block: 'end', inline: 'start' },
    bottomEnd: { block: 'end', inline: 'end' },
    top: { block: 'start', inline: 'stretch' },
    bottom: { block: 'end', inline: 'stretch' },
    fill: { block: 'stretch', inline: 'stretch' },
} as const;

export type AnchorType = keyof typeof anchorEdges;

// Yoga resolves insetInlineStart against layout direction, so mirroring here would flip RTL back.
function resolveAnchorStyle(
    anchor: AnchorType,
    blockOffset: number,
    inlineOffset: number,
): ViewStyle {
    const { block, inline } = anchorEdges[anchor];

    return {
        position: 'absolute',
        insetBlockStart: block === 'end' ? undefined : blockOffset,
        insetBlockEnd: block === 'start' ? undefined : blockOffset,
        insetInlineStart: inline === 'end' ? undefined : inlineOffset,
        insetInlineEnd: inline === 'start' ? undefined : inlineOffset,
    };
}

function resolveWrap(wrap: boolean | undefined): ViewStyle['flexWrap'] {
    if (wrap === undefined) {
        return undefined;
    }

    return wrap ? 'wrap' : 'nowrap';
}

function resolveOverflow(clip: boolean | undefined): ViewStyle['overflow'] {
    if (clip === undefined) {
        return undefined;
    }

    return clip ? 'hidden' : 'visible';
}

export interface BoxStyleProps {
    direction?: DirectionType;
    align?: AlignType;
    justify?: JustifyType;
    selfAlign?: AlignType;
    wrap?: boolean;

    flex?: number;
    grow?: number;
    shrink?: number;

    gap?: number;
    gapBlock?: number;
    gapInline?: number;

    padding?: number;
    paddingBlock?: number;
    paddingInline?: number;
    paddingBlockStart?: number;
    paddingBlockEnd?: number;
    paddingStart?: number;
    paddingEnd?: number;

    margin?: number;
    marginBlock?: number;
    marginInline?: number;
    marginBlockStart?: number;
    marginBlockEnd?: number;
    marginStart?: number;
    marginEnd?: number;

    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;

    radius?: RadiusType;
    clip?: boolean;

    anchor?: AnchorType;
    /** Inset on every edge the anchor pins; negative values overhang the parent. */
    offset?: number;
    offsetBlock?: number;
    offsetInline?: number;
}

// These styles get spread over one another downstream, where an explicit undefined clobbers.
function omitUndefined(style: ViewStyle): ViewStyle {
    const defined = Object.entries(style).filter(([, value]) => value !== undefined);

    // fromEntries widens to a string index; every key came from a ViewStyle.
    return Object.fromEntries(defined) as ViewStyle;
}

export function resolveBoxStyle(props: BoxStyleProps): ViewStyle {
    const {
        direction,
        align,
        justify,
        selfAlign,
        wrap,
        flex,
        grow,
        shrink,
        gap,
        gapBlock,
        gapInline,
        padding,
        paddingBlock,
        paddingInline,
        paddingBlockStart,
        paddingBlockEnd,
        paddingStart,
        paddingEnd,
        margin,
        marginBlock,
        marginInline,
        marginBlockStart,
        marginBlockEnd,
        marginStart,
        marginEnd,
        width,
        height,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        aspectRatio,
        radius,
        clip,
        anchor,
        offset,
        offsetBlock,
        offsetInline,
    } = props;

    const anchorStyle = anchor === undefined
        ? undefined
        : resolveAnchorStyle(
            anchor,
            offsetBlock ?? offset ?? 0,
            offsetInline ?? offset ?? 0,
        );

    return omitUndefined({
        flexDirection: direction === undefined ? undefined : directionValues[direction],
        alignItems: align === undefined ? undefined : alignValues[align],
        justifyContent: justify === undefined ? undefined : justifyValues[justify],
        alignSelf: selfAlign === undefined ? undefined : alignValues[selfAlign],
        flexWrap: resolveWrap(wrap),

        flex,
        flexGrow: grow,
        flexShrink: shrink,

        gap,
        rowGap: gapBlock,
        columnGap: gapInline,

        padding,
        paddingBlock,
        paddingInline,
        paddingBlockStart,
        paddingBlockEnd,
        paddingStart,
        paddingEnd,

        margin,
        marginBlock,
        marginInline,
        marginBlockStart,
        marginBlockEnd,
        marginStart,
        marginEnd,

        width,
        height,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        aspectRatio,

        borderRadius: radius === undefined ? undefined : RADIUS[radius],
        overflow: resolveOverflow(clip),

        ...anchorStyle,
    });
}
