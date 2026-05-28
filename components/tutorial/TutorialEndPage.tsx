import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Text from '@/components/Text';
import { SPACING_MD } from '@/constants/dimensions';
import { FbTutorial } from '@/utils/types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING_MD,
        justifyContent: 'center',
        gap: SPACING_MD,
    },
});

interface Props {
    tutorial: FbTutorial;
    projectId: string;
}

function TutorialEndPage(props: Props) {
    const { tutorial, projectId } = props;
    const router = useRouter();
    const { t } = useTranslation('tutorialScreen');

    const handleStartMapping = useCallback(() => {
        router.replace({
            pathname: '/project/[id]',
            params: { id: projectId },
        });
    }, [router, projectId]);

    return (
        <BlockListView style={styles.container} spacing="md">
            <Text variant="heading" colorVariant="brand">
                {t('readyToMap', { name: tutorial.name })}
            </Text>
            <Text colorVariant="brand">
                {t('outroMessage')}
            </Text>
            <Button
                name="continue"
                title={t('backToProject')}
                colorVariant="primaryGreen"
                styleVariant="filled"
                onPress={handleStartMapping}
            />
        </BlockListView>
    );
}

export default TutorialEndPage;
