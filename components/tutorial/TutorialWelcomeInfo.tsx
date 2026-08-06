import { useTranslation } from 'react-i18next';

import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';

function TutorialWelcomeInfo() {
    const { t } = useTranslation('Tutorial');

    return (
        <Stack spacing="2xs">
            <Text variant="title">{t('tutorial1')}</Text>
            <Text>{t('tutorial2')}</Text>
            <Text>{t('tutorial3')}</Text>
            <Text>{t('tutorial4')}</Text>
        </Stack>
    );
}

export default TutorialWelcomeInfo;
