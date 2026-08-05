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
import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import ImageTile from '@/components/ImageTile';
import ScaleBar from '@/components/ScaleBar';
import Box from '@/components/ui/Box';
import Pager, { type PagerPosition } from '@/components/ui/Pager';
import ProgressBar from '@/components/ui/ProgressBar';
import Stack from '@/components/ui/Stack';
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

/**
 * The tap cycle, and the answer values that reach the backend: 0 No, 1 Yes, 2 Maybe,
 * 3 Bad Imagery, in that order. Spread out of the readonly tuple so listToMap and findIndex
 * can take it.
 */
const OPTIONS = [...TILE_ANSWER_OPTIONS];

/** The answer a downward swipe over the grid writes onto every visible tile. */
const BAD_IMAGERY_VALUE = ANSWER_OPTIONS.badImagery.value;

/**
 * Tiles across a page and down it. Both numbers are load-bearing twice over: they divide the
 * tile out of the window, and `TILE_COLUMNS` is also how a page index is turned back into a
 * column index, which is what the swipe-to-reject gesture marks.
 */
const TILE_COLUMNS = 2;
const TILE_ROWS = 4;

/**
 * Distance the scale bar is lifted off the bottom of the session, clearing the hide-tiles row
 * and the progress bar that sit under the grid. A ScaleBar prop rather than a style: the leaf
 * has not moved into components/ui yet and takes its geometry as numbers.
 */
const SCALE_BAR_BOTTOM_INSET = 40;

/** One column of the grid, after the tasks are sorted and grouped by their tile X. */
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
    // Project completion screen, rendered as the final swipeable page.
    completionPage: ReactNode;
    // Fired once the user scrolls onto the completion page (mapping finished).
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

    // The page showing now, counted the way the pager reports it: the columns first (two to a
    // page), then the completion page. Held here rather than left to the pager because "Go Back"
    // on the outro sets it, and because the progress bar and the swipe gesture read it.
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

    // Counted here as well as inside the pager, and off the window for the same reason the tile
    // is: the progress bar and the completion check need the page count before the pager has
    // reported an index, and a column is narrower than a page so the two do not divide evenly.
    const columnsWidth = groupedTasks.length * tileWidth;
    const contentPages = groupedTasks.length === 0
        ? 0
        : Math.ceil(columnsWidth / pageWidth);

    const atCompletion = contentPages > 0 && currentPage >= contentPages;

    // The leftmost column showing on the current page, which is where the swipe-to-reject
    // gesture starts marking.
    const currentTaskIndex = Math.min(currentPage * TILE_COLUMNS, groupedTasks.length - 1);

    const handleIndexChange = useCallback((index: number, position: PagerPosition) => {
        setCurrentPage(index);

        if (position.isTrailingPage) {
            onReachedEnd?.();
        }
    }, [onReachedEnd]);

    // "Go Back" on the outro returns to the first task so the user reviews the group from the
    // start. The jump is instant (not animated): animating all the way back from the completion
    // page would render every intermediate page and is what made repeated go-backs unstable.
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
            // Derived from TILE_COLUMNS rather than a hardcoded `+ 1`, so the gesture marks
            // exactly the columns on screen if that layout number ever changes.
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
            {/* Clips the grid and owns the downward swipe that rejects the visible columns.
                Box spreads the responder itself, so nothing else can ride in on it. */}
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
                    {/* Its own line below the grid, so the button never grazes the tiles. */}
                    <Stack
                        spacing="none"
                        align="end"
                    >
                        <HideTileSelectionButton
                            handleHideTileSelectionPressIn={handleHideTilePressIn}
                            handleHideTileSelectionPressOut={handleHideTilePressOut}
                            // The row above already places this at the end of its own line, so
                            // the button's default container padding would shift it inwards.
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
