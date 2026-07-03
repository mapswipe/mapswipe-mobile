import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    View,
} from 'react-native';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import { showAlert } from '@/components/Toast';
import {
    SPACING_2XS,
    SPACING_XS,
} from '@/constants/dimensions';
import {
    AnyTutorialTask,
    getReferenceResults,
    isScenarioCorrect,
    TUTORIAL_MAX_ATTEMPTS,
} from '@/utils/tutorial';
import {
    FbObjCustomOption,
    FbScreen,
    FbTutorial,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_LOCATE_FEATURES,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
    Results,
} from '@/utils/types';

import CompareTutorialSession from './CompareTutorialSession';
import LocateTutorialSession from './LocateTutorialSession';
import ScenarioFeedback from './ScenarioFeedback';
import TileGridTutorialSession from './TileGridTutorialSession';
import { ScenarioState } from './types';
import UnsupportedTutorialSession from './UnsupportedTutorialSession';
import ValidateImageTutorialSession from './ValidateImageTutorialSession';
import ValidateTutorialSession from './ValidateTutorialSession';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 0,
        padding: SPACING_XS,
        gap: SPACING_2XS,
    },
    // minHeight:0 lets the slot (and the map inside it) shrink to the space
    // available, so the session's own buttons and the Check Answer button below
    // stay within the viewport instead of being pushed off the bottom.
    sessionSlot: {
        flex: 1,
        minHeight: 0,
    },
});

interface Props {
    tutorial: FbTutorial;
    screen: FbScreen;
    screenIndex: number;
    tasks: AnyTutorialTask[];
    results: Results;
    onScenarioResultsChange: (
        screenIndex: number,
        next: Results | ((prev: Results) => Results),
    ) => void;
    state: ScenarioState;
    attempts: number;
    onScenarioSubmit: (screenIndex: number, correct: boolean) => void;
    onScenarioShowAnswers: (screenIndex: number) => void;
    projectCustomOptions?: FbObjCustomOption[];
}

function TutorialScenarioPage(props: Props) {
    const {
        tutorial,
        screen,
        screenIndex,
        tasks,
        results,
        onScenarioResultsChange,
        state,
        attempts,
        onScenarioSubmit,
        onScenarioShowAnswers,
        projectCustomOptions,
    } = props;

    const { t } = useTranslation('tutorialScreen');

    const handleResultsChange = useCallback((
        next: Results | ((prev: Results) => Results),
    ) => {
        onScenarioResultsChange(screenIndex, next);
    }, [screenIndex, onScenarioResultsChange]);

    const handleSubmit = useCallback(() => {
        const correct = isScenarioCorrect(tutorial.projectType, tasks, results);
        if (!correct) {
            const isOutOfAttempts = attempts + 1 >= TUTORIAL_MAX_ATTEMPTS;
            showAlert({
                title: t('incorrectTitle'),
                message: isOutOfAttempts
                    ? t('noAttemptsLeft')
                    : t('tryAgain'),
                alertType: 'error',
            });
        }
        onScenarioSubmit(screenIndex, correct);
    }, [tutorial.projectType, tasks, results, attempts, screenIndex, onScenarioSubmit, t]);

    const handleShowAnswers = useCallback(() => {
        const referenceResults = getReferenceResults(tasks, tutorial.projectType);
        onScenarioResultsChange(screenIndex, (prev) => ({ ...prev, ...referenceResults }));
        onScenarioShowAnswers(screenIndex);
    }, [tasks, tutorial.projectType, screenIndex, onScenarioResultsChange, onScenarioShowAnswers]);

    const disabled = state === 'correct'
        || state === 'skip-unlocked'
        || state === 'answers-shown';

    let session: React.ReactNode;
    switch (tutorial.projectType) {
        case PROJECT_TYPE_FIND:
        case PROJECT_TYPE_COMPLETENESS:
            session = (
                <TileGridTutorialSession
                    tutorial={tutorial}
                    tasks={tasks}
                    results={results}
                    onResultsChange={handleResultsChange}
                    disabled={disabled}
                />
            );
            break;
        case PROJECT_TYPE_COMPARE:
            session = (
                <CompareTutorialSession
                    tutorial={tutorial}
                    tasks={tasks}
                    results={results}
                    onResultsChange={handleResultsChange}
                    disabled={disabled}
                />
            );
            break;

        case PROJECT_TYPE_VALIDATE_IMAGE:
            session = (
                <ValidateImageTutorialSession
                    tutorial={tutorial}
                    tasks={tasks}
                    results={results}
                    onResultsChange={handleResultsChange}
                    disabled={disabled}
                />
            );
            break;

        case PROJECT_TYPE_VALIDATE:
            session = (
                <ValidateTutorialSession
                    tutorial={tutorial}
                    tasks={tasks}
                    results={results}
                    onResultsChange={handleResultsChange}
                    disabled={disabled}
                />
            );
            break;
        case PROJECT_TYPE_LOCATE_FEATURES:
            session = (
                <LocateTutorialSession
                    tutorial={tutorial}
                    tasks={tasks}
                    results={results}
                    onResultsChange={handleResultsChange}
                    disabled={disabled}
                    projectCustomOptions={projectCustomOptions}
                />
            );
            break;
        default:
            session = <UnsupportedTutorialSession />;
            break;
    }

    const showShowAnswersButton = attempts >= TUTORIAL_MAX_ATTEMPTS && state !== 'correct';
    const actionButton = showShowAnswersButton ? (
        <Button
            name="show-answers"
            title={t('showAnswers')}
            colorVariant="info"
            styleVariant="filled"
            disabled={state === 'answers-shown'}
            onPress={handleShowAnswers}
        />
    ) : (
        <Button
            name="submit"
            title={t('checkAnswer', { attempts, max: TUTORIAL_MAX_ATTEMPTS })}
            colorVariant="primaryGreen"
            styleVariant="filled"
            disabled={state === 'correct'}
            onPress={handleSubmit}
        />
    );

    return (
        <BlockListView style={styles.container} spacing="sm">
            <ScenarioFeedback screen={screen} state={state} />
            <View style={styles.sessionSlot}>
                {session}
            </View>
            {actionButton}
        </BlockListView>
    );
}

export default TutorialScenarioPage;
