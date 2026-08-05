import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { FbTutorial } from '@/utils/types';

interface Props {
    tutorial: FbTutorial;
    projectId: string;
}

function TutorialEndPage(props: Props) {
    const { tutorial, projectId } = props;
    const router = useRouter();
    const { t } = useTranslation('TutorialEndScreen');

    const handleStartMapping = useCallback(() => {
        // dismissTo pops back to the project page already in the stack; replace left two backs.
        router.dismissTo({
            pathname: '/project/[id]',
            params: { id: projectId },
        });
    }, [router, projectId]);

    const backTitle = t('backToProject');

    return (
        <Stack
            spacing="md"
            padding="md"
            grow="fill"
            justify="center"
            align="center"
        >
            <Badge
                sizeVariant="4xl"
                colorVariant="positive"
                iconName="checkmark-outline"
            />
            <Text variant="title" colorVariant="onBrand" align="center">
                {t('readyToMap', { name: tutorial.name })}
            </Text>
            <Text colorVariant="onBrand">
                {t('completedTutorial')}
            </Text>
            <Button
                name="continue"
                title={backTitle}
                accessibilityLabel={backTitle}
                colorVariant="negative"
                onPress={handleStartMapping}
            />
        </Stack>
    );
}

export default TutorialEndPage;
