import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import {
    isDefined,
    isTruthyString,
} from '@togglecorp/fujs';

import BlockListView from '@/components/BlockListView';
import Text from '@/components/Text';
import CompareInstructions from '@/components/tutorial/CompareInstructions';
import LocateInstructions from '@/components/tutorial/LocateInstructions';
import TileGridInstructions from '@/components/tutorial/TileGridInstructions';
import ValidateInstructions from '@/components/tutorial/ValidateInstructions';
import {
    IMAGE_SIZE_MD,
    SPACING_SM,
    SPACING_XS,
} from '@/constants/dimensions';
import {
    FbObjCustomOption,
    FbTutorial,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_LOCATE_FEATURES,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
} from '@/utils/types';

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    content: {
        padding: SPACING_SM,
        gap: SPACING_XS,
    },
    image: {
        width: '100%',
        height: IMAGE_SIZE_MD,
        borderRadius: 12,
    },
});

interface Props {
    tutorial: FbTutorial;
    projectCustomOptions?: FbObjCustomOption[];
}

function TutorialIntroPage(props: Props) {
    const { tutorial, projectCustomOptions } = props;
    const { t } = useTranslation(['instructionsScreen', 'tutorialScreen']);

    const instructionLine = (() => {
        if (
            'instruction' in tutorial
                && typeof tutorial.instruction === 'string'
                && isTruthyString(tutorial.instruction)
        ) {
            return tutorial.instruction;
        }
        if (isTruthyString(tutorial.lookFor)) {
            return t('youAreLookingFor', { lookFor: tutorial.lookFor });
        }
        return undefined;
    })();

    let typeInstructions: React.ReactNode = null;
    if (
        tutorial.projectType === PROJECT_TYPE_FIND
        || tutorial.projectType === PROJECT_TYPE_COMPLETENESS
    ) {
        typeInstructions = <TileGridInstructions />;
    } else if (
        tutorial.projectType === PROJECT_TYPE_VALIDATE
        || tutorial.projectType === PROJECT_TYPE_VALIDATE_IMAGE
    ) {
        typeInstructions = (
            <ValidateInstructions customOptions={tutorial.customOptions} />
        );
    } else if (tutorial.projectType === PROJECT_TYPE_COMPARE) {
        typeInstructions = <CompareInstructions />;
    } else if (tutorial.projectType === PROJECT_TYPE_LOCATE_FEATURES) {
        typeInstructions = <LocateInstructions customOptions={projectCustomOptions} />;
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <BlockListView spacing="xs">
                <Text variant="heading" colorVariant="brand">
                    {tutorial.name}
                </Text>
                {isDefined(instructionLine) && (
                    <Text colorVariant="brand" variant="description">
                        {instructionLine}
                    </Text>
                )}
            </BlockListView>
            {isDefined(tutorial.exampleImage1) && (
                <Image
                    source={tutorial.exampleImage1}
                    style={styles.image}
                />
            )}
            {typeInstructions}
            <Text colorVariant="brand">
                {t('tutorialScreen:swipeThroughIntro')}
            </Text>
        </ScrollView>
    );
}

export default TutorialIntroPage;
