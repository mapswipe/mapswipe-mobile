import {
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams } from 'expo-router';
import { isDefined } from '@togglecorp/fujs';

import TutorialPager from '@/components/tutorial/TutorialPager';
import TutorialWelcomeInfo from '@/components/tutorial/TutorialWelcomeInfo';
import {
    ScenarioState,
    TutorialStage,
} from '@/components/tutorial/types';
import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
import Modal from '@/components/ui/Modal';
import Screen from '@/components/ui/Screen';
import Spinner from '@/components/ui/Spinner';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import {
    AnyTutorialTask,
    decompressTasks,
    groupTasksByGroupAndScreen,
    TUTORIAL_MAX_ATTEMPTS,
} from '@/utils/tutorial';
import {
    FbProject,
    FbTutorial,
    Results,
} from '@/utils/types';

const INFO_LABEL = 'Tutorial information';

function Tutorial() {
    const { id: projectId } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation(['tutorialScreen', 'Tutorial']);
    const { t: tChrome } = useTranslation('mappingSession');
    const projectQuery = useMemo(() => (
        firebaseRef(`v2/projects/${projectId}`)
    ), [projectId]);

    const { data: projectDetails } = useFirebaseDatabase<FbProject>({ query: projectQuery });
    const tutorialId = projectDetails?.tutorialId;

    const tutorialQuery = useMemo(() => (
        isDefined(tutorialId) ? firebaseRef(`v2/projects/${tutorialId}`) : undefined
    ), [tutorialId]);

    const { data: tutorialDetails } = useFirebaseDatabase<FbTutorial>({ query: tutorialQuery });

    const tasksQuery = useMemo(() => (
        isDefined(tutorialId) ? firebaseRef(`v2/tasks/${tutorialId}`) : undefined
    ), [tutorialId]);

    const { data: tasksByGroup } = useFirebaseDatabase<Record<string, unknown>>({
        query: tasksQuery,
    });

    const allTasks = useMemo<AnyTutorialTask[]>(() => {
        if (!tasksByGroup) {
            return [];
        }
        return Object.values(tasksByGroup).flatMap((groupValue) => (
            decompressTasks<AnyTutorialTask>(groupValue as string | AnyTutorialTask[])
        ));
    }, [tasksByGroup]);

    // Different groups reuse screen numbers and synthetic taskIds, so bucket by (groupId, screen).
    const taskBuckets = useMemo(() => groupTasksByGroupAndScreen(allTasks), [allTasks]);

    const stages = useMemo<TutorialStage[]>(() => {
        if (!tutorialDetails) {
            return [];
        }
        // Buckets are ordered by groupId then screen, so the i-th scenario takes the i-th bucket.
        const list: TutorialStage[] = [];
        list.push({ type: 'intro', tutorial: tutorialDetails });
        (tutorialDetails.informationPages ?? []).forEach((page) => {
            list.push({ type: 'info', page });
        });
        (tutorialDetails.screens ?? []).forEach((screen, i) => {
            list.push({
                type: 'scenario',
                screen,
                screenIndex: i,
                tasks: taskBuckets[i]?.tasks ?? [],
            });
        });
        list.push({ type: 'outro', tutorial: tutorialDetails });
        list.push({ type: 'end', tutorial: tutorialDetails });
        return list;
    }, [tutorialDetails, taskBuckets]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [scenarioResults, setScenarioResults] = useState<Record<number, Results>>({});
    const [scenarioStates, setScenarioStates] = useState<Record<number, ScenarioState>>({});
    const [attemptCounts, setAttemptCounts] = useState<Record<number, number>>({});

    const handleScenarioResultsChange = useCallback((
        screenIndex: number,
        next: Results | ((prev: Results) => Results),
    ) => {
        setScenarioResults((prev) => {
            const previousForScreen = prev[screenIndex] ?? {};
            const resolved = typeof next === 'function' ? next(previousForScreen) : next;
            if (resolved === previousForScreen) {
                return prev;
            }
            return { ...prev, [screenIndex]: resolved };
        });
    }, []);

    const handleScenarioSubmit = useCallback((screenIndex: number, correct: boolean) => {
        setAttemptCounts((prev) => {
            const nextAttempts = (prev[screenIndex] ?? 0) + 1;
            let nextState: ScenarioState;
            if (correct) {
                nextState = 'correct';
            } else if (nextAttempts >= TUTORIAL_MAX_ATTEMPTS) {
                nextState = 'skip-unlocked';
            } else {
                nextState = 'wrong';
            }
            setScenarioStates((prevStates) => ({
                ...prevStates,
                [screenIndex]: nextState,
            }));
            return { ...prev, [screenIndex]: nextAttempts };
        });
    }, []);

    const handleScenarioShowAnswers = useCallback((screenIndex: number) => {
        setScenarioStates((prev) => ({ ...prev, [screenIndex]: 'answers-shown' }));
    }, []);

    const canAdvanceFrom = useCallback((index: number) => {
        const stage = stages[index];
        if (!stage || stage.type !== 'scenario') {
            return true;
        }
        const state = scenarioStates[stage.screenIndex];
        return state === 'correct'
            || state === 'skip-unlocked'
            || state === 'answers-shown';
    }, [stages, scenarioStates]);

    const isLoading = !projectDetails || !tutorialDetails;

    const [modal, setModal] = useState<boolean>(false);

    const handleInfoPress = useCallback(() => {
        setModal((prevVisible) => !prevVisible);
    }, []);

    const handleInfoClose = useCallback(() => {
        setModal(false);
    }, []);

    const headerActions = useCallback(() => (
        <IconButton
            name="info"
            iconName="information-outline"
            accessibilityLabel={INFO_LABEL}
            colorVariant="onBrand"
            onPress={handleInfoPress}
        />
    ), [handleInfoPress]);

    return (
        <Screen
            title={t('pageTitle')}
            colorVariant="brand"
            layout="fill"
            withHeader
            backAccessibilityLabel={tChrome('goBack')}
            // The navigator header already covers the status bar, so only the bottom is ours.
            safeArea="bottom"
            headerTitleAlign="center"
            headerActions={headerActions}
        >
            {/* Not Screen's `pending`: that slot replaces the children, hiding the info modal. */}
            {isLoading ? (
                <Box
                    flex={1}
                    align="center"
                    justify="center"
                >
                    <Spinner colorVariant="onBrand" />
                </Box>
            ) : (
                <TutorialPager
                    projectId={projectId}
                    tutorial={tutorialDetails}
                    stages={stages}
                    currentIndex={currentIndex}
                    onIndexChange={setCurrentIndex}
                    canAdvanceFrom={canAdvanceFrom}
                    scenarioResults={scenarioResults}
                    onScenarioResultsChange={handleScenarioResultsChange}
                    scenarioStates={scenarioStates}
                    attemptCounts={attemptCounts}
                    onScenarioSubmit={handleScenarioSubmit}
                    onScenarioShowAnswers={handleScenarioShowAnswers}
                    projectCustomOptions={
                        projectDetails && 'customOptions' in projectDetails
                            ? projectDetails.customOptions
                            : undefined
                    }
                />
            )}
            <Modal
                visible={modal}
                onClose={handleInfoClose}
                closeLabel="I understand"
            >
                <TutorialWelcomeInfo />
            </Modal>
        </Screen>
    );
}

export default Tutorial;
