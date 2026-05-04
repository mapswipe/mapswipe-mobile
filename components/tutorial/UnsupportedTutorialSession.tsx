import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import BlockListView from '@/components/BlockListView';
import Text from '@/components/Text';
import {
    SPACING_2XS,
    SPACING_MD,
} from '@/constants/dimensions';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING_MD,
        justifyContent: 'center',
        gap: SPACING_2XS,
    },
});

function UnsupportedTutorialSession() {
    const { t } = useTranslation('tutorialScreen');

    return (
        <BlockListView style={styles.container} spacing="sm">
            <Text variant="title" colorVariant="brand">
                {t('unsupportedTitle')}
            </Text>
            <Text colorVariant="brand">
                {t('unsupportedDescription')}
            </Text>
        </BlockListView>
    );
}

export default UnsupportedTutorialSession;
