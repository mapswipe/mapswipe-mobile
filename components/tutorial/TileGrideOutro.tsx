import { useTranslation } from 'react-i18next';

import MapswipeMagnifierImage from '@/assets/images/custom/mapswipe_magnifying_glass.png';
import Icon from '@/components/ui/Icon';
import Media from '@/components/ui/Media';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';

import InstructionRow from './InstructionRow';
import TapBadgeIcon from './TapBadgeIcon';

function TileGridOutro() {
    const { t } = useTranslation('TutorialOutroScreen');

    return (
        <Stack spacing="md">
            <Text colorVariant="onBrand" variant="title">
                {t('dontWorryIfYoureUnsure')}
            </Text>
            <InstructionRow
                icon={(
                    <TapBadgeIcon
                        colorVariant="onBrand"
                        iconName="tap"
                        badgeNumber={2}
                        badgeColorVariant="positive"
                    />
                )}
                description={t('youCanAlwaysTapTwice')}
            />
            <InstructionRow
                icon={(
                    <Media
                        source={MapswipeMagnifierImage}
                        sizeVariant="sm"
                        fit="contain"
                        withoutAccessibilityLabel
                    />
                )}
                description={t('everyImageViewedBy')}
            />
            <InstructionRow
                icon={<Icon name="hand-left-outline" colorVariant="onBrand" sizeVariant="5xl" />}
                description={t('holdZoom')}
            />
        </Stack>
    );
}

export default TileGridOutro;
