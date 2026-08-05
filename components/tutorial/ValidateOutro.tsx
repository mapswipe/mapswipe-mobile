import { useTranslation } from 'react-i18next';

import MapswipeMagnifierImage from '@/assets/images/custom/mapswipe_magnifying_glass.png';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';
import Media from '@/components/ui/Media';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';

import InstructionRow from './InstructionRow';

function ValidateOutro() {
    const { t } = useTranslation('BFTutorialOutroScreen');

    return (
        <Stack spacing="md">
            <Text colorVariant="onBrand" variant="title">
                {t('dontWorryIfYoureUnsure')}
            </Text>
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
            <Text colorVariant="onBrand" variant="title">
                {t('wantToChangeYourAnswer')}
            </Text>
            <InstructionRow
                icon={<Icon name="swipe-right" colorVariant="onBrand" sizeVariant="5xl" />}
                description={t('youCanSwipeBack')}
            />
            <InstructionRow
                icon={(
                    <Badge
                        sizeVariant="xl"
                        styleVariant="ringed"
                        colorVariant="positive"
                        iconName="checkmark-outline"
                    />
                )}
                description={t('yourPreviousAnswerIsMarked')}
            />
        </Stack>
    );
}

export default ValidateOutro;
