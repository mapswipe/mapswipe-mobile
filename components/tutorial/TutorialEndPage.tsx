import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Text from '@/components/Text';
import { SPACING_MD } from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { FbTutorial } from '@/utils/types';

import Icon from '../Icon';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING_MD,
        justifyContent: 'center',
        gap: SPACING_MD,
    },
    icon: {
        backgroundColor: theme.success,
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
    },
});

interface Props {
    tutorial: FbTutorial;
    projectId: string;
}

function TutorialEndPage(props: Props) {
    const { tutorial, projectId } = props;
    const router = useRouter();
    const { t } = useTranslation('TutorialEndScreen');
    const styles = useThemedStyles(
        createStyles,
    );
    const handleStartMapping = useCallback(() => {
        // Pop back to the project page that's already in the stack instead of
        // pushing/replacing a new one. Using replace here left the original
        // project page below the tutorial, so the user had to press back twice
        // to reach the project listing. dismissTo falls back to replace when the
        // project page isn't in the stack (e.g. a deep link into the tutorial).
        router.dismissTo({
            pathname: '/project/[id]',
            params: { id: projectId },
        });
    }, [router, projectId]);

    return (
        <BlockListView style={styles.container} spacing="md" withCenteredContent>
            <BlockListView style={styles.icon}>
                <Icon
                    name="checkmark-outline"
                    color="#ffffff"
                    size={60}
                />
            </BlockListView>
            <Text variant="title" colorVariant="brand" style={styles.title}>
                {t('readyToMap', { name: tutorial.name })}
            </Text>
            <Text colorVariant="brand">
                {t('completedTutorial')}
            </Text>
            <Button
                name="continue"
                title={t('backToProject')}
                spacing="sm"
                colorVariant="primaryRed"
                styleVariant="filled"
                onPress={handleStartMapping}
            />
        </BlockListView>
    );
}

export default TutorialEndPage;
