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
import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import ImageTile from '@/components/ImageTile';
import ScaleBar from '@/components/ScaleBar';
import Pager, { type PagerPosition } from '@/components/ui/Pager';
import ProgressBar from '@/components/ui/ProgressBar';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
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

/**
 * The tap cycle, and the answer values that reach the backend: 0 No, 1 Yes, 2 Maybe,
 * 3 Bad Imagery, in that order. Spread out of the readonly tuple so listToMap and findIndex
 * can take it.
 */
const OPTIONS = [...TILE_ANSWER_OPTIONS];

// Before and After are stacked, so the two of them share the window's block axis.
const TILE_ROWS = 2;

// Inline chrome the pair does not get: a 10pt gutter on each side of a tile.
const TILE_RESERVE_INLINE = 20;

const TILE_RESERVE_BLOCK = 240;

interface Props {
    taskGroupId: string;
    projectDetails: CompareProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
    // Project completion screen, rendered as the final swipeable page.
    completionPage: ReactNode;
    // Fired once the user scrolls onto the completion page (mapping finished).
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

    // The page showing now, counted the way the pager reports it: the tasks first, then the
    // completion page. Held here rather than left to the pager because "Go Back" on the outro
    // sets it.
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

    // "Go Back" on the outro returns to the first task so the user reviews the group from the
    // start. The jump is instant (not animated): animating all the way back from the completion
    // page would render every intermediate page and is what made repeated go-backs unstable.
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
