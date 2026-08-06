import {
    cloneElement,
    Dispatch,
    isValidElement,
    type ReactElement,
    type ReactNode,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
    listToMap,
} from '@togglecorp/fujs';

import AccessibilityInfoModal from '@/components/AccessibilityInfoModal';
import HideTileSelectionButton from '@/components/ui/HideTileSelectionButton';
import ScaleBar from '@/components/ui/map/ScaleBar';
import Pager, { type PagerPosition } from '@/components/ui/Pager';
import ProgressBar from '@/components/ui/ProgressBar';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import ImageTile from '@/components/ui/tile/ImageTile';
import { TILE_ANSWER_OPTIONS } from '@/constants/answers';
import useAnswerBadgesEnabled from '@/hooks/useAnswerBadgesEnabled';
import useAnswerColors from '@/hooks/useAnswerColors';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useFittedTileWidth from '@/hooks/useFittedTileWidth';
import useViewport from '@/hooks/useViewport';
import { firebaseRef } from '@/utils/firebase';
import {
    CompareProject,
    FbMappingGroupTileMapServiceCreateOnlyInput,
    FbMappingTaskCompareCreateOnlyInput,
    Results,
} from '@/utils/types';

// Tap cycle order, and the values sent to the backend: 0 No, 1 Yes, 2 Maybe, 3 Bad Imagery.
const OPTIONS = [...TILE_ANSWER_OPTIONS];

const TILE_ROWS = 2;

const TILE_RESERVE_INLINE = 20;

const TILE_RESERVE_BLOCK = 240;

interface Props {
    taskGroupId: string;
    projectDetails: CompareProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
    completionPage: ReactNode;
    onReachedEnd?: () => void;
}

function CompareMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
        completionPage,
        onReachedEnd,
    } = props;

    // Owned here, not by the pager, because "Go Back" on the outro sets it.
    const [pageIndex, setPageIndex] = useState(0);

    const {
        width: pageWidth,
        height: pageHeight,
    } = useViewport();

    const groupQuery = useMemo(() => (
        firebaseRef(`v2/groups/${projectDetails.projectId}/${taskGroupId}`)
    ), [taskGroupId, projectDetails.projectId]);

    const taskQuery = useMemo(() => (
        firebaseRef(`v2/tasks/${projectDetails.projectId}/${taskGroupId}`)
    ), [projectDetails.projectId, taskGroupId]);

    const { data: compressedTasks = [] } = useFirebaseDatabase<
        FbMappingTaskCompareCreateOnlyInput[]
    >({
        query: taskQuery,
    });

    const tasks = useMemo(() => (
        isDefined(compressedTasks) ? compressedTasks : []
    ), [compressedTasks]);

    const { data: groupDetails } = useFirebaseDatabase<
        FbMappingGroupTileMapServiceCreateOnlyInput
    >({
        query: groupQuery,
    });

    const taskCount = compressedTasks.length;

    // The pager appends the completion page after the tasks, so its index is the task count.
    const atCompletion = taskCount > 0 && pageIndex >= taskCount;
    const currentTaskIndex = Math.min(pageIndex, taskCount - 1);

    useEffect(() => {
        if (isNotDefined(tasks) || tasks.length === 0) {
            return;
        }

        onResultsChange((prev) => {
            if (Object.keys(prev).length > 0) {
                return prev;
            }
            return listToMap(
                tasks,
                ({ taskId }) => taskId,
                () => OPTIONS[0].value,
            );
        });
    }, [tasks, onResultsChange]);

    const getNextValue = useCallback((value: number | undefined) => {
        if (isNotDefined(value)) {
            return OPTIONS[0].value;
        }

        const optionIndex = OPTIONS.findIndex(
            ({ value: optionValue }) => value === optionValue,
        );

        const nextIndex = optionIndex + 1;
        if (optionIndex === -1 || nextIndex >= OPTIONS.length) {
            return OPTIONS[0].value;
        }

        return OPTIONS[nextIndex].value;
    }, []);

    const handleTilePress = useCallback((taskId: string) => {
        onResultsChange((prevResults) => {
            const prevValue = prevResults[taskId];
            return {
                ...prevResults,
                [taskId]: getNextValue(typeof prevValue === 'number' ? prevValue : undefined),
            };
        });
    }, [getNextValue, onResultsChange]);

    const answerColors = useAnswerColors(OPTIONS);

    const handleIndexChange = useCallback((index: number, position: PagerPosition) => {
        setPageIndex(index);

        if (position.isTrailingPage) {
            onReachedEnd?.();
        }
    }, [onReachedEnd]);

    // Jump must stay instant: animating back from the outro renders every page in between.
    const handleOutroGoBack = useCallback(() => {
        setPageIndex(0);
    }, []);

    const tileWidth = useFittedTileWidth({
        availableInline: pageWidth,
        availableBlock: pageHeight,
        reserveInline: TILE_RESERVE_INLINE,
        reserveBlock: TILE_RESERVE_BLOCK,
        rows: TILE_ROWS,
    });

    const latitude = useMemo(() => {
        if (!groupDetails) {
            return undefined;
        }
        return (
            Math.atan(
                Math.sinh(Math.PI * (1 - (2 * groupDetails.yMin) / 2 ** projectDetails.zoomLevel)),
            ) * (180 / Math.PI)
        );
    }, [projectDetails, groupDetails]);

    const [hideTilePressValue, setHideTilePressValue] = useState(false);

    const handleHideTilePressIn = useCallback(() => {
        setHideTilePressValue(true);
    }, []);

    const handleHideTilePressOut = useCallback(() => {
        setHideTilePressValue(false);
    }, []);

    const { isAnswerBadgesEnabled } = useAnswerBadgesEnabled();

    const selectTaskKey = useCallback(
        (task: FbMappingTaskCompareCreateOnlyInput) => task.taskId,
        [],
    );

    const renderTask = useCallback((task: FbMappingTaskCompareCreateOnlyInput) => {
        if (!task.url || !task.urlB) {
            return null;
        }

        const result = results[task.taskId];
        const answer = typeof result === 'number' ? answerColors[result] : undefined;

        const tintColor = hideTilePressValue ? undefined : answer?.tintColor;
        const badge = isAnswerBadgesEnabled && !hideTilePressValue ? answer : undefined;

        return (
            <Stack
                spacing="3xs"
                align="center"
            >
                <Text colorVariant="onBrand">Before</Text>
                <ImageTile
                    taskId={task.taskId}
                    url={task.url}
                    urlB={undefined}
                    width={tileWidth}
                    tintColor={tintColor}
                    onPress={handleTilePress}
                    accessibilityBadgeIconName={badge?.iconName}
                    accessibilityBadgeColor={badge?.badgeColor}
                />
                <Text colorVariant="onBrand">After</Text>
                <ImageTile
                    taskId={task.taskId}
                    url={task.urlB}
                    urlB={undefined}
                    width={tileWidth}
                    tintColor={tintColor}
                    onPress={handleTilePress}
                    accessibilityBadgeIconName={badge?.iconName}
                    accessibilityBadgeColor={badge?.badgeColor}
                />
            </Stack>
        );
    }, [
        results,
        answerColors,
        hideTilePressValue,
        isAnswerBadgesEnabled,
        tileWidth,
        handleTilePress,
    ]);

    const renderCompletionPage = useCallback(() => (
        isValidElement(completionPage)
            ? cloneElement(
                completionPage as ReactElement<{ onGoBack?: () => void }>,
                { onGoBack: handleOutroGoBack },
            )
            : completionPage
    ), [completionPage, handleOutroGoBack]);

    return (
        <>
            <Pager
                sizeVariant="page"
                data={compressedTasks}
                keyExtractor={selectTaskKey}
                renderPage={renderTask}
                renderTrailingPage={renderCompletionPage}
                index={pageIndex}
                onIndexChange={handleIndexChange}
                scrollBehavior="instant"
            />
            {!atCompletion && (
                <>
                    {isDefined(latitude) && (
                        <ScaleBar
                            latitude={latitude}
                            position="bottom"
                            referenceSize={tileWidth}
                            tileSize={tileWidth}
                            zoomLevel={projectDetails?.zoomLevel}
                        />
                    )}
                    <HideTileSelectionButton
                        handleHideTileSelectionPressIn={handleHideTilePressIn}
                        handleHideTileSelectionPressOut={handleHideTilePressOut}
                    />
                    <ProgressBar
                        progress={(currentTaskIndex + 1) / taskCount}
                        colorVariant="onBrand"
                    />
                </>
            )}
            {isAnswerBadgesEnabled && <AccessibilityInfoModal />}
        </>
    );
}

export default CompareMappingSession;
