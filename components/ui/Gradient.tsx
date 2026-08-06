import { LinearGradient } from 'expo-linear-gradient';

import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    type AnchorType,
    resolveBoxStyle,
} from '@/utils/layout';

export interface GradientProps {
    style?: never;
    paletteIndex: number;
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
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={gradient}
            pointerEvents="none"
        />
    );
}

export default Gradient;
