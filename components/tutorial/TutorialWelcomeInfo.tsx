import React from 'react';
import { useTranslation } from 'react-i18next';

import BlockListView from '../BlockListView';
import Text from '../Text';

function TutorialWelcomeInfo() {
    const { t } = useTranslation('Tutorial');
    return (
        <BlockListView spacing="2xs">
            <Text>{t('tutorial1')}</Text>
            <Text>{t('tutorial2')}</Text>
            <Text>{t('tutorial3')}</Text>
            <Text>{t('tutorial4')}</Text>
        </BlockListView>
    );
}

export default TutorialWelcomeInfo;
