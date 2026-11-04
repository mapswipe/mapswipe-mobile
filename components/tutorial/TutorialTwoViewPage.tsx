import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
} from 'react-native';

import BlockListView from '@/components/BlockListView';
import Text from '@/components/Text';
import {
    SPACING_SM,
    SPACING_XS,
} from '@/constants/dimensions';

import ValidateTwoViewInstructions from './ValidateTwoViewInstructions';

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    content: {
        padding: SPACING_SM,
        gap: SPACING_XS,
    },
});

function TutorialTwoViewPage() {
    const { t } = useTranslation('tutorialScreen');

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <BlockListView spacing="xs">
                <Text variant="heading" colorVariant="brand">
                    {t('validateTwoViewTitle')}
                </Text>
                <Text colorVariant="brand" variant="description">
                    {t('validateTwoViewDescription')}
                </Text>
            </BlockListView>
            <ValidateTwoViewInstructions />
            <Text colorVariant="brand">
                {t('validateTwoViewSwipe')}
            </Text>
        </ScrollView>
    );
}

export default TutorialTwoViewPage;
