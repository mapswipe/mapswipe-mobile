import {
    cloneElement,
    type Dispatch,
    isValidElement,
    type ReactElement,
    type ReactNode,
    type SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { PanResponder } from 'react-native';
import {
    compareNumber,
    isDefined,
    isNotDefined,
    listToGroupList,
    listToMap,
    mapToList,
} from '@togglecorp/fujs';

import AccessibilityInfoModal from '@/components/AccessibilityInfoModal';
import Box from '@/components/ui/Box';
import HideTileSelectionButton from '@/components/ui/HideTileSelectionButton';
import ScaleBar from '@/components/ui/map/ScaleBar';
import Pager, { type PagerPosition } from '@/components/ui/Pager';
import ProgressBar from '@/components/ui/ProgressBar';
import Stack from '@/components/ui/Stack';
import ImageTile from '@/components/ui/tile/ImageTile';
import {
    ANSWER_OPTIONS,
    TILE_ANSWER_OPTIONS,
} from '@/constants/answers';
import useAnswerBadgesEnabled from '@/hooks/useAnswerBadgesEnabled';
import useAnswerColors from '@/hooks/useAnswerColors';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useFittedTileWidth from '@/hooks/useFittedTileWidth';
import useViewport from '@/hooks/useViewport';
import { firebaseRef } from '@/utils/firebase';
import { resolveVisibleColumnRange } from '@/utils/grid';
import { buildTasks } from '@/utils/task';
import {
    CompletenessProject,
    FbMappingGroupTileMapServiceCreateOnlyInput,
    FindProject,
    PROJECT_TYPE_COMPLETENESS,
    Results,
    TileTask,
} from '@/utils/types';

// Tap cycle order, and the values sent to the backend: 0 No, 1 Yes, 2 Maybe, 3 Bad Imagery.
const OPTIONS = [...TILE_ANSWER_OPTIONS];

const BAD_IMAGERY_VALUE = ANSWER_OPTIONS.badImagery.value;

// TILE_COLUMNS both divides the tile out of the window and maps a page index back to a column,
// so the layout and the swipe hit-test must keep using the same number.
const TILE_COLUMNS = 2;
const TILE_ROWS = 4;

// Lifts the scale bar clear of the hide-tiles row and the progress bar below the grid.
const SCALE_BAR_BOTTOM_INSET = 40;

type TileColumnTask = Omit<TileTask, 'taskX' | 'taskY'> & {
    taskX: number;
    taskY: number;
};

interface TileColumn {
    taskX: string;
    taskList: TileColumnTask[];
}

interface Props {
    taskGroupId: string;
    projectDetails: FindProject | CompletenessProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
    completionPage: ReactNode;
    onReachedEnd?: () => void;
}

function TileGridMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
        completionPage,
        onReachedEnd,
    } = props;

    // Owned here, not by the pager: the outro's "Go Back", the progress bar and the swipe read it.
    const [currentPage, setCurrentPage] = useState(0);

    const {
        width: pageWidth,
        height: pageHeight,
    } = useViewport();

    const taskGroupQuery = useMemo(() => (
        firebaseRef(`v2/groups/${projectDetails.projectId}/${taskGroupId}`)
    ), [taskGroupId, projectDetails.projectId]);

    const { data: groupDetails } = useFirebaseDatabase<
        FbMappingGroupTileMapServiceCreateOnlyInput
    >({
        query: taskGroupQuery,
    });

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

    const tasks = useMemo(() => {
        if (isNotDefined(groupDetails)) {
            return [];
        }

        return buildTasks(projectDetails, groupDetails);
    }, [groupDetails, projectDetails]);

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

    const groupedTasks = useMemo<TileColumn[]>(() => {
        if (isNotDefined(tasks) || tasks.length === 0) {
            return [];
        }

        const sortedTasks = [...tasks].sort(
            (a, b) => (compareNumber(a.taskX, b.taskX) || compareNumber(a.taskY, b.taskY)),
        ).map((task) => {
            const {
                taskX,
                taskY,
                ...otherProps
            } = task;

            if (isNotDefined(taskX) || isNotDefined(taskY)) {
                return undefined;
            }

            return {
                ...otherProps,
                taskX,
                taskY,
            };
        }).filter(isDefined);

        return mapToList(
            listToGroupList(
                sortedTasks,
                (task) => task.taskX,
            ),
            (columnList, key) => ({
                taskX: key,
                taskList: columnList,
            }),
        );
    }, [tasks]);

    const tileWidth = useFittedTileWidth({
        availableInline: pageWidth,
        availableBlock: pageHeight,
        columns: TILE_COLUMNS,
        rows: TILE_ROWS,
    });

    // Page count is needed before the pager reports an index, and columns do not divide evenly.
    const columnsWidth = groupedTasks.length * tileWidth;
    const contentPages = groupedTasks.length === 0
        ? 0
        : Math.ceil(columnsWidth / pageWidth);

    const atCompletion = contentPages > 0 && currentPage >= contentPages;

    // Leftmost column on the current page, where swipe-to-reject starts marking.
    const currentTaskIndex = Math.min(currentPage * TILE_COLUMNS, groupedTasks.length - 1);

    const handleIndexChange = useCallback((index: number, position: PagerPosition) => {
        setCurrentPage(index);

        if (position.isTrailingPage) {
            onReachedEnd?.();
        }
    }, [onReachedEnd]);

    // Jump must stay instant: animating back from the outro renders every page in between.
    const handleOutroGoBack = useCallback(() => {
        setCurrentPage(0);
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

    const markVisibleTilesAsWrong = useCallback(() => {
        onResultsChange((prevResults) => {
            const newResults = { ...prevResults };
            // Derived from TILE_COLUMNS so the gesture marks exactly the columns on screen.
            const range = resolveVisibleColumnRange({
                firstColumnIndex: currentTaskIndex,
                columns: TILE_COLUMNS,
                columnCount: groupedTasks.length,
            });
            if (!range) {
                return prevResults;
            }
            for (let i = range.startIndex; i <= range.endIndex; i += 1) {
                groupedTasks[i].taskList.forEach((task) => {
                    newResults[task.taskId] = BAD_IMAGERY_VALUE;
                });
            }
            return newResults;
        });
    }, [currentTaskIndex, groupedTasks, onResultsChange]);

    const swipeResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponderCapture: (_, { dy, dx }) => (
            dy > 50 && Math.abs(dy) > Math.abs(dx) * 2
        ),
        onPanResponderRelease: (_, { dy }) => {
            if (dy > 80) {
                markVisibleTilesAsWrong();
            }
        },
    }), [markVisibleTilesAsWrong]);

    const { isAnswerBadgesEnabled } = useAnswerBadgesEnabled();

    const answerColors = useAnswerColors(OPTIONS);

    const selectColumnKey = useCallback((column: TileColumn) => column.taskX, []);

    const renderColumn = useCallback((column: TileColumn) => (
        <Stack
            spacing="none"
            justify="center"
            grow="fill"
        >
            {column.taskList.map((task) => {
                if (!task.url) {
                    return null;
                }

                const result = results[task.taskId];
                const answer = typeof result === 'number' ? answerColors[result] : undefined;

                const tintColor = hideTilePressValue ? undefined : answer?.tintColor;
                const badge = isAnswerBadgesEnabled && !hideTilePressValue ? answer : undefined;

                return (
                    <ImageTile
                        key={task.taskId}
                        taskId={task.taskId}
                        url={task.url}
                        urlB={
                            projectDetails.projectType === PROJECT_TYPE_COMPLETENESS
                                ? task.urlB
                                : undefined
                        }
                        width={tileWidth}
                        tintColor={tintColor}
                        onPress={handleTilePress}
                        accessibilityBadgeIconName={badge?.iconName}
                        accessibilityBadgeColor={badge?.badgeColor}
                    />
                );
            })}
        </Stack>
    ), [
        results,
        answerColors,
        hideTilePressValue,
        isAnswerBadgesEnabled,
        tileWidth,
        handleTilePress,
        projectDetails.projectType,
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
            {/* Owns the downward swipe that rejects the visible columns. */}
            <Box
                flex={1}
                clip
                panResponder={swipeResponder}
            >
                <Pager
                    sizeVariant="strip"
                    itemWidth={tileWidth}
                    data={groupedTasks}
                    keyExtractor={selectColumnKey}
                    renderPage={renderColumn}
                    renderTrailingPage={renderCompletionPage}
                    index={currentPage}
                    onIndexChange={handleIndexChange}
                    scrollBehavior="instant"
                />
            </Box>
            {!atCompletion && (
                <>
                    {isDefined(latitude) && (
                        <ScaleBar
                            latitude={latitude}
                            position="bottom"
                            referenceSize={tileWidth}
                            tileSize={tileWidth}
                            zoomLevel={projectDetails?.zoomLevel}
                            bottomPadding={SCALE_BAR_BOTTOM_INSET}
                        />
                    )}
                    <Stack
                        spacing="none"
                        align="end"
                    >
                        <HideTileSelectionButton
                            handleHideTileSelectionPressIn={handleHideTilePressIn}
                            handleHideTileSelectionPressOut={handleHideTilePressOut}
                            // The row already end-aligns it; the default padding would shift it in.
                            withoutContainer
                        />
                    </Stack>
                    <ProgressBar
                        progress={Math.min(currentPage + 1, contentPages) / contentPages}
                        colorVariant="onBrand"
                        accessibilityLabel="Session progress"
                    />
                </>
            )}
            {isAnswerBadgesEnabled && <AccessibilityInfoModal />}
        </>
    );
}

export default TileGridMappingSession;
