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

/**
 * Three of phosphor's six weights. `thin` and `light` are indistinguishable from `regular` at
 * these sizes, and `duotone` is inert without a second raw colour prop.
 */
const EMPHASIS_WEIGHT = {
    regular: 'regular',
    strong: 'bold',
    filled: 'fill',
} as const satisfies Record<string, IconWeight>;

export type IconEmphasis = keyof typeof EMPHASIS_WEIGHT;

export interface IconProps {
    /** Glyph to draw. The union is closed, so a typo is a compile error rather than a blank. */
    name: IconName;
    /** Required: eleven rungs and none is the majority. */
    sizeVariant: IconSizeType;
    /** Defaults to `default`. Phosphor's own fallback is a hard-coded black, dark theme or not. */
    colorVariant?: ColorVariant;
    /** Stroke weight, and the only way to get a filled glyph. */
    emphasis?: IconEmphasis;
}

/**
 * A themed glyph: a size rung, a ColorVariant and a three-value weight, where components/Icon
 * takes raw pixels and hex.
 *
 *
 * No accessibility prop: react-native-svg does not mark an Svg as an accessibility element, so
 * the label belongs on the pressable or the text beside it.
 */
function Icon(props: IconProps) {
    const {
        name,
        sizeVariant,
        colorVariant = 'default',
        emphasis = 'regular',
    } = props;

    const theme = useTheme();

    const Glyph = ICON_GLYPH[name];

    // An unknown name renders nothing rather than throwing: the only way to reach this is an
    // `as IconName` cast over backend data, and backend data must never crash the app.
    if (Glyph === undefined) {
        return null;
    }

    return (
        <Glyph
            // Size and colour cross as props, never through a style. react-native-svg builds
            // `{...style, ...props}` in that order, so props win and a style object loses
            // silently: that is how a `style={{ color }}` ends up drawing black.
            size={ICON_SIZE[sizeVariant]}
            // `content` and never `onSurface`: an icon is a foreground on whatever its parent
            // painted, so it pairs with the surrounding text, not with a surface of its own.
            color={resolveColor(theme, colorVariant, 'content')}
            weight={EMPHASIS_WEIGHT[emphasis]}
        />
    );
}

export default Icon;
