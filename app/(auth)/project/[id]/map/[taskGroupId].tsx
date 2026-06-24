import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    BackHandler,
    StyleSheet,
} from 'react-native';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { set as setToDatabase } from 'firebase/database';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import CompareMappingSession from '@/components/CompareMappingSession';
import IconButton from '@/components/IconButton';
import LocateFeaturesMappingSession from '@/components/LocateFeaturesMappingSession';
import Modal from '@/components/Modal';
import Page from '@/components/Page';
import SessionOutro, { type ResultSyncStatus } from '@/components/SessionOutro';
import StreetMappingSession from '@/components/StreetMappingSession';
import Text from '@/components/Text';
import TileGridMappingSession from '@/components/TileGridMappingSession';
import CompareInstructions from '@/components/tutorial/CompareInstructions';
import LocateInstructions from '@/components/tutorial/LocateInstructions';
import TileGridInstructions from '@/components/tutorial/TileGridInstructions';
import ValidateInstructions from '@/components/tutorial/ValidateInstructions';
import ValidateImageMappingSession from '@/components/ValidateImageMappingSession';
import ValidateMappingSession from '@/components/ValidateMappingSession';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import {
    getAnswerCounts,
    getResultOptions,
} from '@/utils/results';
import {
    FbProject,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_LOCATE_FEATURES,
    PROJECT_TYPE_STREET,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
    Results,
} from '@/utils/types';

const styles = StyleSheet.create({
    headerButtonPadding: {
        padding: 8,
    },
});

function MapTaskGroup() {
    const {
        id: projectId,
        taskGroupId,
    } = useLocalSearchParams<{id: string; taskGroupId: string;}>();
    const router = useRouter();

    const startTimestampRef = useRef<string | undefined>(undefined);
    const endTimestampRef = useRef<string | undefined>(undefined);
    const [modal, setModal] = useState<boolean>(false);
    const [continueModal, setContinueModal] = useState<boolean>(false);

    const { user } = useAuth();

    const projectQuery = useMemo(
        () => firebaseRef(`v2/projects/${projectId}`),
        [projectId],
    );

    const { data: projectDetails } = useFirebaseDatabase<FbProject>({
        query: projectQuery,
    });
    const [results, setResults] = useState<Results>({});
    const [completed, setCompleted] = useState(false);
    const [resultSyncStatus, setResultSyncStatus] = useState<ResultSyncStatus>('not-started');
    const [sessionDurationMs, setSessionDurationMs] = useState<number | undefined>(undefined);

    const userId = user?.uid;

    // Per-answer counts and the number of tiles reviewed, for the session summary.
    const answerCounts = useMemo(
        () => (isDefined(projectDetails)
            ? getAnswerCounts(results, getResultOptions(projectDetails))
            : []),
        [results, projectDetails],
    );
    const reviewedCount = useMemo(() => Object.keys(results).length, [results]);

    // Stamps the end time once (the moment mapping finished) and derives the
    // session duration shown on the outro. Idempotent across re-entries.
    const markSessionEnd = useCallback(() => {
        if (isDefined(endTimestampRef.current)) {
            return;
        }
        const end = new Date().toISOString();
        endTimestampRef.current = end;
        const start = startTimestampRef.current;
        if (isDefined(start)) {
            setSessionDurationMs(new Date(end).getTime() - new Date(start).getTime());
        }
    }, []);

    const handleSessionComplete = useCallback(() => {
        markSessionEnd();
        setCompleted(true);
    }, [markSessionEnd]);

    const saveResults = useCallback(async () => {
        if (isNotDefined(userId)) {
            return false;
        }

        setResultSyncStatus('in-progress');
        // Scroll-completion sessions render the outro as a swipeable page and
        // never call handleSessionComplete, so stamp the end time at submit if
        // it has not been set yet.
        if (isNotDefined(endTimestampRef.current)) {
            endTimestampRef.current = new Date().toISOString();
        }
        const resultsLocationRef = firebaseRef(
            `v2/results/${projectId}/${taskGroupId}/${userId}`,
        );

        const resultPayload = {
            startTime: startTimestampRef.current,
            endTime: endTimestampRef.current,
            results,
            // FIXME: add actual appVersion and clientType
            appVersion: '3.0.0 (0)-dev',
            clientType: 'mobile-android',
        };

        try {
            await setToDatabase(resultsLocationRef, resultPayload);
            setResultSyncStatus('successful');
            return true;
        } catch (err: unknown) {
            // eslint-disable-next-line no-console
            console.error(err);
            setResultSyncStatus('failed');
            return false;
        }
    }, [projectId, taskGroupId, userId, results]);

    const handleCompleteSession = useCallback(async () => {
        const ok = await saveResults();
        if (ok) {
            router.replace('/');
        }
    }, [saveResults, router]);

    const handleContinueMapping = useCallback(async () => {
        const ok = await saveResults();
        if (!ok) {
            return;
        }
        setResults({});
        setCompleted(false);
        setResultSyncStatus('not-started');
        setSessionDurationMs(undefined);
        startTimestampRef.current = new Date().toISOString();
        endTimestampRef.current = undefined;
        router.replace({
            pathname: '/project/[id]/map',
            params: {
                id: projectId,
                projectInstruction: projectDetails?.projectInstruction,
                previousGroupId: taskGroupId,
            },
        });
    }, [saveResults, router, projectId, projectDetails?.projectInstruction, taskGroupId]);

    const handleGoBack = useCallback(() => {
        setCompleted(false);
    }, []);

    const handleDiscardSession = useCallback(() => {
        setResults({});
        setCompleted(false);
        setResultSyncStatus('not-started');
        router.replace('/');
    }, [router]);

    useEffect(() => {
        startTimestampRef.current = new Date().toISOString();
    }, []);

    const infoButton = () => (
        <IconButton
            name={!modal}
            iconName="information-outline"
            onPress={setModal}
            stylesContainer={styles.headerButtonPadding}
        />
    );

    const handleContinueModalOpen = useCallback(() => {
        setContinueModal(!continueModal);
    }, [continueModal]);

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Intercept the Android hardware back button while mapping so an accidental
    // press opens the confirmation modal instead of silently discarding the
    // session. On the outro (completed) we let the default navigation proceed.
    useEffect(() => {
        const onHardwareBack = () => {
            if (completed) {
                return false;
            }
            handleContinueModalOpen();
            return true;
        };
        const subscription = BackHandler.addEventListener(
            'hardwareBackPress',
            onHardwareBack,
        );
        return () => subscription.remove();
    }, [completed, handleContinueModalOpen]);

    // Rendered as the final swipeable page inside the scroll-completion
    // sessions (FIND / COMPLETENESS / COMPARE / LOCATE_FEATURES). It omits the
    // "Go back" button because swiping back to the tasks replaces it.
    const completionPage = (
        <SessionOutro
            resultSyncStatus={resultSyncStatus}
            onContinueMapping={handleContinueMapping}
            onCompleteSession={handleCompleteSession}
            onDiscardSession={handleDiscardSession}
            swipeBackHint
            answerCounts={answerCounts}
            reviewedCount={reviewedCount}
            durationMs={sessionDurationMs}
        />
    );

    return (
        <Page
            title={projectDetails?.projectInstruction ?? 'Map Project'}
            variant="brand"
            scrollable={false}
            showBackButton
            headerTitleAlign="center"
            headerRight={infoButton}
            onClickBackButton={handleContinueModalOpen}
        >
            {completed ? (
                <SessionOutro
                    resultSyncStatus={resultSyncStatus}
                    onContinueMapping={handleContinueMapping}
                    onCompleteSession={handleCompleteSession}
                    onGoBack={handleGoBack}
                    onDiscardSession={handleDiscardSession}
                    answerCounts={answerCounts}
                    reviewedCount={reviewedCount}
                    durationMs={sessionDurationMs}
                />
            ) : (
                <>
                    {projectDetails?.projectType === PROJECT_TYPE_FIND && (
                        <TileGridMappingSession
                            taskGroupId={taskGroupId}
                            projectDetails={projectDetails}
                            results={results}
                            onResultsChange={setResults}
                            completionPage={completionPage}
                            onReachedEnd={markSessionEnd}
                        />
                    )}
                    {projectDetails?.projectType === PROJECT_TYPE_COMPARE && (
                        <CompareMappingSession
                            taskGroupId={taskGroupId}
                            projectDetails={projectDetails}
                            results={results}
                            onResultsChange={setResults}
                            completionPage={completionPage}
                            onReachedEnd={markSessionEnd}
                        />
                    )}
                    {projectDetails?.projectType === PROJECT_TYPE_VALIDATE && (
                        <ValidateMappingSession
                            taskGroupId={taskGroupId}
                            projectDetails={projectDetails}
                            results={results}
                            onResultsChange={setResults}
                            onSessionComplete={handleSessionComplete}
                        />
                    )}
                    {projectDetails?.projectType === PROJECT_TYPE_COMPLETENESS && (
                        <TileGridMappingSession
                            taskGroupId={taskGroupId}
                            projectDetails={projectDetails}
                            results={results}
                            onResultsChange={setResults}
                            completionPage={completionPage}
                            onReachedEnd={markSessionEnd}
                        />
                    )}
                    {projectDetails?.projectType === PROJECT_TYPE_VALIDATE_IMAGE && (
                        <ValidateImageMappingSession
                            taskGroupId={taskGroupId}
                            projectDetails={projectDetails}
                            results={results}
                            onResultsChange={setResults}
                            onSessionComplete={handleSessionComplete}
                        />
                    )}
                    {projectDetails?.projectType === PROJECT_TYPE_STREET && (
                        <StreetMappingSession
                            taskGroupId={taskGroupId}
                            projectDetails={projectDetails}
                        />
                    )}
                    {projectDetails?.projectType === PROJECT_TYPE_LOCATE_FEATURES && (
                        <LocateFeaturesMappingSession
                            taskGroupId={taskGroupId}
                            projectDetails={projectDetails}
                            results={results}
                            onResultsChange={setResults}
                            completionPage={completionPage}
                            onReachedEnd={markSessionEnd}
                        />
                    )}
                </>
            )}
            <Modal
                open={!modal}
                visible={modal}
                onClose={setModal}
                closeButtonName="I understand"
            >
                {(projectDetails?.projectType === PROJECT_TYPE_FIND
                 || projectDetails?.projectType === PROJECT_TYPE_COMPLETENESS)
                  && (
                      <TileGridInstructions
                          colorVariants="normal"
                      />
                  )}
                {(projectDetails?.projectType === PROJECT_TYPE_VALIDATE
                 || projectDetails?.projectType === PROJECT_TYPE_VALIDATE_IMAGE)
                  && (
                      <ValidateInstructions
                          colorVariants="normal"
                          customOptions={projectDetails.customOptions}
                      />
                  )}
                {(projectDetails?.projectType === PROJECT_TYPE_COMPARE)
                  && (
                      <CompareInstructions
                          colorVariants="normal"
                      />
                  )}
                {(projectDetails?.projectType === PROJECT_TYPE_LOCATE_FEATURES)
                  && (
                      <LocateInstructions
                          customOptions={projectDetails.customOptions}
                          colorVariants="normal"
                      />
                  )}
            </Modal>
            <Modal
                visible={continueModal}
                open={!continueModal}
            >
                <BlockListView spacing="xs">
                    <BlockListView spacing="3xs">
                        <Text variant="title">
                            Stop Mapping?
                        </Text>
                        <Text variant="label">
                            {'You\'re about to leave the mapping screen.Are you sure you want to return to the menu?'}
                        </Text>
                    </BlockListView>
                    <Button
                        name="continue-mapping"
                        spacing="xs"
                        title="Continue mapping"
                        onPress={handleContinueModalOpen}
                    />
                    <Button
                        name="back-to-menu"
                        colorVariant="primaryRed"
                        spacing="xs"
                        title="Back to Project"
                        onPress={handleBack}
                    />
                </BlockListView>
            </Modal>
        </Page>
    );
}

export default MapTaskGroup;
