import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import {
    FbTutorial,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_LOCATE_FEATURES,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
} from '@/utils/types';

import TileGridOutro from './TileGrideOutro';
import ValidateOutro from './ValidateOutro';

interface Props {
    tutorial: FbTutorial;
}

function TutorialOutroPage(props: Props) {
    const { tutorial } = props;
    const { t } = useTranslation('TutorialIntroScreen');

    let typeOutro: ReactNode = null;
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
        <Stack
            spacing="md"
            padding="md"
            align="center"
        >
            {typeOutro}
            <Text colorVariant="onBrand" variant="title">
                {t('SwipeToContinue')}
            </Text>
        </Stack>
    );
}

export default TutorialOutroPage;
