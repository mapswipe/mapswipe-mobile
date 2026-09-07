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
    useRef,
    useState,
} from 'react';
import {
    FlatList,
    PanResponder,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import {
    compareNumber,
    isDefined,
    isNotDefined,
    listToGroupList,
    listToMap,
    mapToList,
} from '@togglecorp/fujs';

import ProgressBar from '@/components/ProgressBar';
import ScaleBar from '@/components/ScaleBar';
import useAccessibility from '@/hooks/useAccessibility';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseRef } from '@/utils/firebase';
import { getAccessibilityBadge } from '@/utils/results';
import { buildTasks } from '@/utils/task';
import {
    CompletenessProject,
    FbMappingGroupTileMapServiceCreateOnlyInput,
    FindProject,
    PROJECT_TYPE_COMPLETENESS,
    ResultOption,
    Results,
} from '@/utils/types';

import AccessibilityInfoModal from './AccessibilityInfoModal';
import HideTileSelectionButton from './HideTileSelectionButton';
import ImageTile from './ImageTile';

const createStyles = () => StyleSheet.create({
    content: {
        alignItems: 'center',
    },
    tileGridWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    // Give the hide button its own centered line below the map so it doesn't
    // sit flush against (and graze) the tiles.
    hideButtonRow: {
        alignItems: 'flex-end',
        paddingHorizontal: 6,
    },
    hideButtonInner: {
        alignItems: 'center',
    },
});

const VIEWABILITY_CONFIG = {
    viewAreaCoveragePercentThreshold: 50,
};

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

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    // True while the swipeable completion page is showing, so the session
    // chrome (scale bar, progress bar, hide-tiles button) can be hidden there.
    const [atCompletion, setAtCompletion] = useState(false);
    // Height of the scroll viewport, so the completion page can fill it and
    // anchor its action buttons to the bottom.
    const [viewportHeight, setViewportHeight] = useState(0);
    // Current page index (each page = two tile columns), used to drive the
    // progress bar so it advances cleanly per page rather than per column.
    const [currentPage, setCurrentPage] = useState(0);

    const styles = useThemedStyles(createStyles);

    const {
        width: pageWidth,
        height: pageHeight,
    } = useWindowDimensions();

    const taskGroupQuery = useMemo(() => (
        firebaseRef(`v2/groups/${projectDetails.projectId}/${taskGroupId}`)
    ), [taskGroupId, projectDetails.projectId]);

    const { data: groupDetails } = useFirebaseDatabase<
        FbMappingGroupTileMapServiceCreateOnlyInput
    >({
        query: taskGroupQuery,
    });

    const options = useMemo<ResultOption[]>(() => ([
        { value: 0, label: 'No', color: 'transparent' },
        { value: 1, label: 'Yes', color: 'green' },
        { value: 2, label: 'Maybe', color: 'yellow' },
        { value: 3, label: 'Bad Imagery', color: 'red' },
    ]), []);

    const getNextValue = useCallback((value: number | undefined) => {
        if (isNotDefined(value)) {
            return options[0].value;
        }

        const optionIndex = options.findIndex(
            ({ value: optionValue }) => value === optionValue,
        );

        const nextIndex = optionIndex + 1;
        if (optionIndex === -1 || nextIndex >= options.length) {
            return options[0].value;
        }

        return options[nextIndex].value;
    }, [options]);

    const optionsByValue = useMemo(() => (
        listToMap(options, ({ value }) => value)
    ), [options]);

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
                () => options[0].value,
            );
        });
    }, [tasks, options, onResultsChange]);

    const groupedTasks = useMemo(() => {
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

    const flatListRef = useRef<FlatList<typeof groupedTasks[number]>>(null);

    const tileWidth = Math.min(pageWidth / 2, pageHeight / 4);

    // The completion page is appended as a full-width page after the tile
    // columns. `completionLeftFiller` pads the columns up to the next page
    // boundary so the outro always snaps cleanly (handles odd column counts and
    // single-column groups). The trailing snap offset is the completion page.
    const columnsWidth = groupedTasks.length * tileWidth;
    const contentPages = groupedTasks.length === 0
        ? 0
        : Math.ceil(columnsWidth / pageWidth);
    const completionLeftFiller = Math.round(contentPages * pageWidth - columnsWidth);
    const pageSnapOffsets = useMemo(
        () => Array.from({ length: contentPages + 1 }, (_, i) => i * pageWidth),
        [contentPages, pageWidth],
    );

    const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / pageWidth);
        const itemIndex = Math.min(pageIndex * 2, groupedTasks.length - 1);
        setCurrentTaskIndex(itemIndex);
        setCurrentPage(pageIndex);
        const onCompletionPage = pageIndex >= contentPages;
        setAtCompletion(onCompletionPage);
        if (onCompletionPage) {
            onReachedEnd?.();
        }
    }, [pageWidth, groupedTasks.length, contentPages, onReachedEnd]);

    // "Go Back" on the outro returns to the first task so the user reviews the
    // group from the start. The jump is instant (not animated): animating all
    // the way back from the completion page would render every intermediate
    // page and is what made repeated go-backs unstable.
    const handleOutroGoBack = useCallback(() => {
        flatListRef.current?.scrollToOffset({
            offset: 0,
            animated: false,
        });
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

    const BAD_IMAGERY_VALUE = 3;

    const markVisibleTilesAsWrong = useCallback(() => {
        onResultsChange((prevResults) => {
            const newResults = { ...prevResults };
            const startIdx = currentTaskIndex;
            const endIdx = Math.min(
                currentTaskIndex + 1,
                groupedTasks.length - 1,
            );
            for (let i = startIdx; i <= endIdx; i += 1) {
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

    const { isAccessibilityEnabled } = useAccessibility();

    return (
        <>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <View style={styles.tileGridWrapper} {...swipeResponder.panHandlers}>
                <FlatList
                    ref={flatListRef}
                    data={groupedTasks}
                    contentContainerStyle={styles.content}
                    keyExtractor={(groupedTaskItem) => groupedTaskItem.taskX}
                    renderItem={({ item: groupedTasksFromRenderer }) => (
                        <View>
                            {groupedTasksFromRenderer.taskList.map((task) => {
                                const result = results[task.taskId];
                                const selectedOption = typeof result === 'number'
                                    ? optionsByValue[result]
                                    : undefined;

                                if (!task.url) {
                                    return null;
                                }
                                const badge = isAccessibilityEnabled && !hideTilePressValue
                                    ? getAccessibilityBadge(
                                        typeof result === 'number' ? result : undefined,
                                    )
                                    : undefined;

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
                                        tintColor={hideTilePressValue ? 'transparent' : selectedOption?.color}
                                        onPress={handleTilePress}
                                        accessibilityBadgeIconName={badge?.iconName}
                                        accessibilityBadgeColor={badge?.color}
                                    />
                                );
                            })}
                        </View>
                    )}
                    onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
                    ListFooterComponent={groupedTasks.length > 0 ? (
                        <View
                            style={StyleSheet.flatten({
                                flexDirection: 'row',
                                width: completionLeftFiller + pageWidth,
                                height: viewportHeight || undefined,
                            })}
                        >
                            {completionLeftFiller > 0 && (
                                <View style={{ width: completionLeftFiller }} />
                            )}
                            <View style={{ width: pageWidth }}>
                                {isValidElement(completionPage)
                                    ? cloneElement(
                                        completionPage as ReactElement<{ onGoBack?: () => void }>,
                                        // handleOutroGoBack only reads the FlatList ref when
                                        // invoked (on button press), never during render.
                                        // eslint-disable-next-line react-hooks/refs
                                        { onGoBack: handleOutroGoBack },
                                    )
                                    : completionPage}
                            </View>
                        </View>
                    ) : null}
                    horizontal
                    pagingEnabled
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    disableIntervalMomentum
                    snapToOffsets={pageSnapOffsets}
                    viewabilityConfig={VIEWABILITY_CONFIG}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    windowSize={3}
                    initialNumToRender={2}
                    // removeClippedSubviews
                />
            </View>
            {!atCompletion && (
                <>
                    {latitude && (
                        <ScaleBar
                            latitude={latitude}
                            position="bottom"
                            referenceSize={tileWidth}
                            tileSize={tileWidth}
                            zoomLevel={projectDetails?.zoomLevel}
                            bottomPadding={40}
                        />
                    )}
                    <View style={styles.hideButtonRow}>
                        <HideTileSelectionButton
                            handleHideTileSelectionPressIn={handleHideTilePressIn}
                            handleHideTileSelectionPressOut={handleHideTilePressOut}
                            isPressed={hideTilePressValue}
                            containerStyle={styles.hideButtonInner}
                        />
                    </View>
                    <ProgressBar
                        currentValue={Math.min(currentPage + 1, contentPages)}
                        totalValue={contentPages}
                        colorVariant="brand"
                    />
                </>
            )}
            {isAccessibilityEnabled && <AccessibilityInfoModal />}
        </>
    );
}

export default TileGridMappingSession;
