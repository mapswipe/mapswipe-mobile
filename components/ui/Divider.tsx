import {
    View,
    type ViewStyle,
} from 'react-native';

import { BORDER_WIDTH_HAIRLINE } from '@/constants/border';
import {
    type AppTheme,
    type ThemeColorKey,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveBoxStyle } from '@/utils/layout';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

/**
 * The theme ships exactly two rule colours, and COLOR_ROLE cannot name the second one:
 * its `border` slot reaches `divider` (via secondary / muted / sunken) but never
 * `dividerOnBrand`, whose nearest neighbour `borderOnBrand` is a different alpha. A
 * ColorVariant prop would therefore be both lossy and eleven variants too wide, since a
 * rule has no use for `negative` or `informative`.
 */
export type DividerColorVariant = 'default' | 'onBrand';

const VARIANT_COLOR: Record<DividerColorVariant, ThemeColorKey> = {
    default: 'divider',
    onBrand: 'dividerOnBrand',
};

// One box, so this returns the style itself rather than a StyleSheet: resolveBoxStyle
// already hands back a ViewStyle, and there is no second entry to name.
const createStyle = (
    theme: AppTheme,
    options: {
        colorVariant: DividerColorVariant;
        spacing: SpacingType;
    },
): ViewStyle => {
    const { colorVariant, spacing } = options;

    return {
        ...resolveBoxStyle({
            // Stretch rather than width 100%: the rule then spans whichever cross axis its
            // parent gives it, without assuming the parent is unpadded.
            selfAlign: 'stretch',
            height: BORDER_WIDTH_HAIRLINE,
            marginBlock: getSpacingValue(spacing),
        }),
        backgroundColor: theme[VARIANT_COLOR[colorVariant]],
    };
};

export interface DividerProps {
    /** `default` for light surfaces, `onBrand` for the dark session chrome. */
    colorVariant?: DividerColorVariant;
    /**
     * Breathing room above and below the rule, as a margin. Leave it out when the parent
     * already gaps its children, or the two will add up.
     */
    spacing?: SpacingType;
}

/**
 * A hairline rule between items. The width is not configurable: both rules the app draws
 * are hairlines, and hairlineWidth is the only value that stays one physical pixel across
 * densities, so a thickness prop would exist only to let a caller draw a fatter line than
 * the design has.
 */
function Divider(props: DividerProps) {
    const {
        colorVariant = 'default',
        spacing = 'none',
    } = props;

    const style = useThemedStyles(createStyle, { colorVariant, spacing });

    return <View style={style} />;
}

export default Divider;
