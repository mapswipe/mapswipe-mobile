import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { set as setToDatabase } from 'firebase/database';

import CompareMappingSession from '@/components/CompareMappingSession';
import LocateFeaturesMappingSession from '@/components/LocateFeaturesMappingSession';
import SessionOutro, { type ResultSyncStatus } from '@/components/SessionOutro';
import StreetMappingSession from '@/components/StreetMappingSession';
import TileGridMappingSession from '@/components/TileGridMappingSession';
import CompareInstructions from '@/components/tutorial/CompareInstructions';
import LocateInstructions from '@/components/tutorial/LocateInstructions';
import TileGridInstructions from '@/components/tutorial/TileGridInstructions';
import ValidateInstructions from '@/components/tutorial/ValidateInstructions';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Divider from '@/components/ui/Divider';
import IconButton from '@/components/ui/IconButton';
import Modal from '@/components/ui/Modal';
import Screen from '@/components/ui/Screen';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import ValidateImageMappingSession from '@/components/ValidateImageMappingSession';
import ValidateMappingSession from '@/components/ValidateMappingSession';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useHardwareBackHandler from '@/hooks/useHardwareBackHandler';
import usePreventScreenRemove from '@/hooks/usePreventScreenRemove';
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

const INFO_LABEL = 'Project information';

function MapTaskGroup() {
    const {
        id: projectId,
        taskGroupId,
    } = useLocalSearchParams<{id: string; taskGroupId: string;}>();
    const router = useRouter();
    const { t } = useTranslation('mappingSession');
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

    const answerCounts = useMemo(
        () => (isDefined(projectDetails)
            ? getAnswerCounts(results, getResultOptions(projectDetails))
            : []),
        [results, projectDetails],
    );
    const reviewedCount = useMemo(() => Object.keys(results).length, [results]);

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
        // Scroll-completion sessions never call handleSessionComplete, so stamp the end time here.
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

    // STREET has no how-to section, so there is nothing to divide from the summary.
    const showInstructionsDivider = isDefined(projectDetails)
        && projectDetails.projectType !== PROJECT_TYPE_STREET;

    const openContinueModal = useCallback(() => {
        setContinueModal(true);
    }, []);

    const closeContinueModal = useCallback(() => {
        setContinueModal(false);
    }, []);

    // All three back paths (header, iOS swipe, Android hardware) open the same confirm dialog.
    const { leave } = usePreventScreenRemove({
        enabled: Platform.OS === 'ios',
        onAttemptLeave: openContinueModal,
    });
    useHardwareBackHandler({ onBackPress: openContinueModal });

    const handleLeaveMapping = useCallback(() => {
        setContinueModal(false);
        leave();
    }, [leave]);

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
        <Screen
            title={projectDetails?.projectInstruction ?? 'Map Project'}
            colorVariant="brand"
            layout="fill"
            withHeader
            backAccessibilityLabel={t('goBack')}
            // The navigator header already covers the status bar, so only the bottom is ours.
            safeArea="bottom"
            headerTitleAlign="center"
            headerActions={headerActions}
            onBackPress={openContinueModal}
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
                visible={modal}
                onClose={handleInfoClose}
                closeLabel="I understand"
            >
                <Stack spacing="sm">
                    {isDefined(projectDetails) && (
                        <Stack spacing="3xs">
                            <Text variant="title">
                                {projectDetails.name}
                            </Text>
                            {isDefined(projectDetails.projectInstruction) && (
                                <Text
                                    variant="description"
                                    colorVariant="secondary"
                                >
                                    {projectDetails.projectInstruction}
                                </Text>
                            )}
                        </Stack>
                    )}
                    {showInstructionsDivider && <Divider />}
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
                </Stack>
            </Modal>
            <ConfirmDialog
                visible={continueModal}
                styleVariant="destructive"
                title="Stop Mapping?"
                message={'You\'re about to leave the mapping screen.Are you sure you want to return to the menu?'}
                cancelLabel="Continue mapping"
                confirmLabel="Back to Project"
                onCancel={closeContinueModal}
                onConfirm={handleLeaveMapping}
            />
        </Screen>
    );
}

export default MapTaskGroup;
