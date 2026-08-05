import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
    isDefined,
    isTruthyString,
} from '@togglecorp/fujs';

import CompareInstructions from '@/components/tutorial/CompareInstructions';
import LocateInstructions from '@/components/tutorial/LocateInstructions';
import TileGridInstructions from '@/components/tutorial/TileGridInstructions';
import ValidateInstructions from '@/components/tutorial/ValidateInstructions';
import ListView from '@/components/ui/ListView';
import Media from '@/components/ui/Media';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
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

// The page rides entirely in the list header, so there are no rows.
const NO_ROWS: readonly never[] = [];

// Unreachable, but ListView requires a key selector and a renderer.
function selectNoKey(): string {
    return '';
}

function renderNoRow(): null {
    return null;
}

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

    let typeInstructions: ReactNode = null;
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
        <ListView
            data={NO_ROWS}
            keySelector={selectNoKey}
            renderItem={renderNoRow}
            spacing="none"
            padding="sm"
            grow="slot"
            header={(
                <Stack spacing="xs">
                    <Text variant="heading" colorVariant="onBrand">
                        {tutorial.name}
                    </Text>
                    {isDefined(instructionLine) && (
                        <Text colorVariant="onBrand" variant="description">
                            {instructionLine}
                        </Text>
                    )}
                    {isDefined(tutorial.exampleImage1) && (
                        <Media
                            source={tutorial.exampleImage1}
                            sizeVariant="illustration"
                            styleVariant="rounded"
                            withoutAccessibilityLabel
                        />
                    )}
                    {typeInstructions}
                    <Text colorVariant="onBrand">
                        {t('tutorialScreen:swipeThroughIntro')}
                    </Text>
                </Stack>
            )}
        />
    );
}

export default TutorialIntroPage;
