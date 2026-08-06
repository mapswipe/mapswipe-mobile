import { type IconWeight } from 'phosphor-react-native';

import {
    ICON_GLYPH,
    type IconName,
} from '@/constants/icons';
import {
    ICON_SIZE,
    type IconSizeType,
} from '@/constants/size';
import {
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import useTheme from '@/hooks/useTheme';

export type { IconName };

// Three of phosphor's six weights: the others look identical here or need a second colour.
const EMPHASIS_WEIGHT = {
    regular: 'regular',
    strong: 'bold',
    filled: 'fill',
} as const satisfies Record<string, IconWeight>;

export type IconEmphasis = keyof typeof EMPHASIS_WEIGHT;

export interface IconProps {
    style?: never;
    name: IconName;
    sizeVariant: IconSizeType;
    colorVariant?: ColorVariant;
    emphasis?: IconEmphasis;
}

// No accessibility prop: react-native-svg does not mark an Svg as an accessibility element, so
// the label belongs on the pressable or the text beside it.
function Icon(props: IconProps) {
    const {
        name,
        sizeVariant,
        colorVariant = 'default',
        emphasis = 'regular',
    } = props;

    const theme = useTheme();

    const Glyph = ICON_GLYPH[name];

    // An unknown name renders nothing rather than throwing: backend data must not crash the app.
    if (Glyph === undefined) {
        return null;
    }

    return (
        <Glyph
            // Size and colour must be props: react-native-svg lets props win over style, silently.
            size={ICON_SIZE[sizeVariant]}
            color={resolveColor(theme, colorVariant, 'content')}
            weight={EMPHASIS_WEIGHT[emphasis]}
        />
    );
}

export default Icon;
