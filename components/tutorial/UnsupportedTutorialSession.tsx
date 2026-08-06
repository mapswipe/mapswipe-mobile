import { useTranslation } from 'react-i18next';

import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';

function UnsupportedTutorialSession() {
    const { t } = useTranslation('tutorialScreen');

    return (
        <Stack
            spacing="sm"
            padding="md"
            grow="fill"
            justify="center"
        >
            <Text variant="title" colorVariant="onBrand">
                {t('unsupportedTitle')}
            </Text>
            <Text colorVariant="onBrand">
                {t('unsupportedDescription')}
            </Text>
        </Stack>
    );
}

export default UnsupportedTutorialSession;
