import {
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { isDefined } from '@togglecorp/fujs';

import IconButton from '@/components/IconButton';
import Modal from '@/components/Modal';
import Page from '@/components/Page';
import TutorialPager from '@/components/tutorial/TutorialPager';
import TutorialWelcomeInfo from '@/components/tutorial/TutorialWelcomeInfo';
import {
    ScenarioState,
    TutorialStage,
} from '@/components/tutorial/types';
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

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoBtn: {
        padding: 0,
        margin: 0,
    },
    headerButtonPadding: {
        padding: 8,
    },
});

function Tutorial() {
    const { id: projectId } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation(['tutorialScreen', 'Tutorial']);
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

    // Bucket tasks by (groupId, screen) so each scenario shows a single group's
    // tiles. Different groups can reuse the same screen number and synthetic taskId,
    // which would otherwise merge (and collide) into one scenario.
    const taskBuckets = useMemo(() => groupTasksByGroupAndScreen(allTasks), [allTasks]);

    const stages = useMemo<TutorialStage[]>(() => {
        if (!tutorialDetails) {
            return [];
        }
        // Map the i-th scenario to the i-th task bucket. Buckets are ordered by
        // groupId then screen, so scenarios line up deterministically even when
        // `screen` values aren't sequential 0/1-based indices.
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

    const infoButton = useCallback(() => (
        <IconButton
            name={!modal}
            iconName="information-outline"
            onPress={setModal}
            stylesButton={styles.infoBtn}
            stylesContainer={styles.headerButtonPadding}
        />
    ), [modal]);
    return (
        <Page
            title={t('pageTitle')}
            variant="brand"
            scrollable={false}
            showBackButton
            headerTitleAlign="center"
            headerRight={infoButton}
        >
            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#ffffff" />
                </View>
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
                open={!modal}
                visible={modal}
                onClose={setModal}
                closeButtonName="I understand"
            >
                <TutorialWelcomeInfo />
            </Modal>
        </Page>
    );
}

export default Tutorial;
