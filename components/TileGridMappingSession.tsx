import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    FlatList,
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

import ImageTile from './ImageTile';

const createStyles = () => StyleSheet.create({
    content: {
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
}

function TileGridMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

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

        onResultsChange(
            listToMap(
                tasks,
                ({ taskId }) => taskId,
                () => options[0].value,
            ),
        );
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

    const handleTilePress = useCallback((taskId: string) => {
        onResultsChange((prevResults) => ({
            ...prevResults,
            [taskId]: getNextValue(prevResults[taskId]),
        }));
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

    return (
        <>
            <FlatList
                data={groupedTasks}
                contentContainerStyle={styles.content}
                keyExtractor={(groupedTaskItem) => groupedTaskItem.taskX}
                renderItem={({ item: groupedTasksFromRenderer }) => (
                    <View>
                        {groupedTasksFromRenderer.taskList.map((task) => {
                            const result = results[task.taskId];
                            const selectedOption = isDefined(result)
                                ? optionsByValue[result]
                                : undefined;

                            if (!task.url) {
                                return null;
                            }
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
                                    tintColor={selectedOption?.color}
                                    onPress={handleTilePress}
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
                scrollEventThrottle={16}
                windowSize={3}
                initialNumToRender={2}
                // removeClippedSubviews
            />
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
            <ProgressBar
                currentValue={Math.floor(currentTaskIndex / 2) + 1}
                totalValue={Math.ceil(groupedTasks.length / 2)}
                colorVariant="brand"
            />
        </>
    );
}

export default TileGridMappingSession;
