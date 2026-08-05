import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Icon, { type IconName } from '@/components/ui/Icon';
import Positioned from '@/components/ui/Positioned';
import {
    ICON_SIZE,
    type IconSizeType,
} from '@/constants/size';
import { type ColorVariant } from '@/constants/theme';

const GLYPH_SIZE: IconSizeType = '5xl';

const BADGE_OVERHANG_BLOCK = -2;
const BADGE_OVERHANG_INLINE = -4;

interface Props {
    iconName?: IconName;
    badgeNumber?: number;

    // Raw colour for Firebase author data; wins over badgeColorVariant.
    badgeColor?: string;

    badgeColorVariant?: ColorVariant;

    colorVariant?: ColorVariant;

}

function TapBadgeIcon(props: Props) {
    const {
        iconName = 'tap',
        badgeNumber,
        badgeColor,
        badgeColorVariant,
        colorVariant = 'onBrand',
    } = props;

    return (
        <Box
            width={ICON_SIZE[GLYPH_SIZE]}
            height={ICON_SIZE[GLYPH_SIZE]}
        >
            <Icon
                name={iconName}
                sizeVariant={GLYPH_SIZE}
                colorVariant={colorVariant}
            />
            {/* badgeNumber={0} renders a bare 0; callers never send it. */}
            {badgeNumber && (badgeColor || badgeColorVariant) && (
                <Positioned
                    anchor="topEnd"
                    offsetBlock={BADGE_OVERHANG_BLOCK}
                    offsetInline={BADGE_OVERHANG_INLINE}
                >
                    <Badge
                        sizeVariant="sm"
                        colorVariant={badgeColorVariant}
                        dotColor={badgeColor}
                        label={String(badgeNumber)}
                    />
                </Positioned>
            )}
        </Box>
    );
}

export default TapBadgeIcon;
