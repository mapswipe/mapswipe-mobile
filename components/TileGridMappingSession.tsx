import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    FlatList,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
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
    onSessionComplete: () => void;
}

function TileGridMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
        onSessionComplete,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const completedRef = useRef(false);
    const onLastPageRef = useRef(false);

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

    const tileWidth = Math.min(pageWidth / 2, pageHeight / 4);

    const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / pageWidth);
        const itemIndex = Math.min(pageIndex * 2, groupedTasks.length - 1);
        setCurrentTaskIndex(itemIndex);
    }, [pageWidth, groupedTasks.length]);

    const handleMomentumScrollEnd = useCallback((
        event: NativeSyntheticEvent<NativeScrollEvent>,
    ) => {
        if (completedRef.current) return;

        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const maxScrollable = contentSize.width - layoutMeasurement.width;

        if (maxScrollable <= 0) return;
        const arrivedAtEnd = contentOffset.x >= maxScrollable - 1;

        if (arrivedAtEnd) {
            if (onLastPageRef.current) {
                completedRef.current = true;
                onSessionComplete();
            } else {
                onLastPageRef.current = true;
            }
        } else {
            onLastPageRef.current = false;
        }
    }, [onSessionComplete]);

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

    const getAccessibilityBadge = useCallback((value: number | undefined) => {
        switch (value) {
            case 1: return { iconName: 'checkmark-outline', color: '#22C55E' } as const;
            case 2: return { iconName: 'question-mark', color: '#F59E0B' } as const;
            case 3: return { iconName: 'ban-outline', color: '#EF4444' } as const;
            default: return undefined;
        }
    }, []);

    return (
        <>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            <View style={styles.tileGridWrapper} {...swipeResponder.panHandlers}>
                <FlatList
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
                    horizontal
                    pagingEnabled
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    disableIntervalMomentum
                    snapToOffsets={groupedTasks.map((_, i) => i * pageWidth)}
                    viewabilityConfig={VIEWABILITY_CONFIG}
                    onScroll={handleScroll}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    scrollEventThrottle={16}
                    windowSize={3}
                    initialNumToRender={2}
                    // removeClippedSubviews
                />
            </View>
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
            <HideTileSelectionButton
                handleHideTileSelectionPressIn={handleHideTilePressIn}
                handleHideTileSelectionPressOut={handleHideTilePressOut}
                isPressed={hideTilePressValue}
            />
            <ProgressBar
                currentValue={Math.floor(currentTaskIndex / 2) + 1}
                totalValue={Math.ceil(groupedTasks.length / 2)}
                colorVariant="brand"
            />
            {isAccessibilityEnabled && <AccessibilityInfoModal />}
        </>
    );
}

export default TileGridMappingSession;
