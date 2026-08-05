import { LinearGradient } from 'expo-linear-gradient';

import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    type AnchorType,
    resolveBoxStyle,
} from '@/utils/layout';

/**
 * A decorative fill drawn from the theme's gradient palette, picked by index.
 *
 * It exists because a card with no imagery still needs a dark ground for its light text to read
 * against: a flat surface leaves a white title on a near-white panel. So this is a legibility
 * primitive as much as a decorative one, which is why it is not simply a Scrim rung. Scrim ramps
 * one colour to transparent along the block axis; this ramps between two palette colours
 * diagonally, and the palette is what varies per item.
 *
 * The index is deliberately a plain number rather than a named rung: the caller is distributing
 * items across a palette (usually by hashing an id), so which entry any one item gets carries no
 * design meaning. Out-of-range values wrap, so a caller never has to know the palette's length.
 */
export interface GradientProps {
    /** Any integer. Wrapped into the palette, so a hash can be passed straight in. */
    paletteIndex: number;
    /** Defaults to filling the parent, which is the only shape a backdrop wants. */
    anchor?: AnchorType;
}

const createStyle = (theme: AppTheme, options: { anchor: AnchorType }) => ({
    gradient: resolveBoxStyle({ anchor: options.anchor }),
    palette: theme.projectCardGradients,
});

function Gradient(props: GradientProps) {
    const {
        paletteIndex,
        anchor = 'fill',
    } = props;

    const { gradient, palette } = useThemedStyles(createStyle, { anchor });

    // Modulo twice: a negative hash would otherwise index from the wrong end.
    const pair = palette[((paletteIndex % palette.length) + palette.length) % palette.length];

    return (
        <LinearGradient
            colors={pair}
            // Diagonal, top-left to bottom-right, which is how the palette was drawn.
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={gradient}
            pointerEvents="none"
        />
    );
}

export default Gradient;
