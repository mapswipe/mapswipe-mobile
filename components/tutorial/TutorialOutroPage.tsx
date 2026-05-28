import React from 'react';
import { useTranslation } from 'react-i18next';

import {
    FbTutorial,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_LOCATE_FEATURES,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
} from '@/utils/types';

import BlockListView from '../BlockListView';
import Text from '../Text';
import TileGridOutro from './TileGrideOutro';
import ValidateOutro from './ValidateOutro';

interface Props {
    tutorial: FbTutorial;
}

function TutorialOutroPage(props: Props) {
    const { tutorial } = props;
    const { t } = useTranslation('TutorialIntroScreen');

    let typeOutro: React.ReactNode = null;
    if (
        tutorial.projectType === PROJECT_TYPE_FIND
        || tutorial.projectType === PROJECT_TYPE_COMPLETENESS
        || tutorial.projectType === PROJECT_TYPE_LOCATE_FEATURES
        || tutorial.projectType === PROJECT_TYPE_COMPARE
    ) {
        typeOutro = <TileGridOutro />;
    } else if (
        tutorial.projectType === PROJECT_TYPE_VALIDATE
        || tutorial.projectType === PROJECT_TYPE_VALIDATE_IMAGE
    ) {
        typeOutro = (
            <ValidateOutro />
        );
    }
    return (
        <BlockListView withPadding withCenteredContent>
            {typeOutro}
            <Text colorVariant="brand" variant="title">
                {t('SwipeToContinue')}
            </Text>
        </BlockListView>
    );
}

export default TutorialOutroPage;
