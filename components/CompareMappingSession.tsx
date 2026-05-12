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
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import {
    isDefined,
    isNotDefined,
    listToMap,
} from '@togglecorp/fujs';

import ProgressBar from '@/components/ProgressBar';
import ScaleBar from '@/components/ScaleBar';
import Text from '@/components/Text';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseRef } from '@/utils/firebase';
import {
    CompareProject,
    FbMappingGroupTileMapServiceCreateOnlyInput,
    FbMappingTaskCompareCreateOnlyInput,
    ResultOption,
    Results,
} from '@/utils/types';

import ImageTile from './ImageTile';

const createStyles = () => StyleSheet.create({
    content: {
        // flex: 1,
        alignItems: 'center',
    },
    taskContent: {
        alignItems: 'center',
        width: SCREEN_WIDTH,
        paddingBottom: 40,
        gap: 10,
    },
});

const VIEWABILITY_CONFIG = {
    viewAreaCoveragePercentThreshold: 50,
};

interface Props {
    taskGroupId: string;
    projectDetails: CompareProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
    onSessionComplete: () => void;
}

function CompareMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
        onSessionComplete,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const completedRef = useRef(false);
    const styles = useThemedStyles(createStyles);

    const {
        width: pageWidth,
        height: pageHeight,
    } = useWindowDimensions();

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

    const options = useMemo<ResultOption[]>(() => ([
        { value: 0, label: 'No', color: 'transparent' },
        { value: 1, label: 'Yes', color: 'green' },
        { value: 2, label: 'Maybe', color: 'yellow' },
        { value: 3, label: 'Bad Imagery', color: 'red' },
    ]), []);

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

    const handleTilePress = useCallback((taskId: string) => {
        onResultsChange((prevResults) => ({
            ...prevResults,
            [taskId]: getNextValue(prevResults[taskId]),
        }));
    }, [getNextValue, onResultsChange]);

    const optionsByValue = useMemo(() => (
        listToMap(options, ({ value }) => value)
    ), [options]);

    const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / pageWidth);
        const itemIndex = Math.min(pageIndex * 2, compressedTasks.length - 1);
        setCurrentTaskIndex(itemIndex);
    }, [pageWidth, compressedTasks.length]);

    const handleMomentumScrollEnd = useCallback((
        event: NativeSyntheticEvent<NativeScrollEvent>,
    ) => {
        if (completedRef.current) {
            return;
        }
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const maxScrollable = contentSize.width - layoutMeasurement.width;
        if (maxScrollable <= 0) {
            return;
        }
        if (contentOffset.x >= maxScrollable - 1) {
            completedRef.current = true;
            onSessionComplete();
        }
    }, [onSessionComplete]);

    // FIXME: Discuss with Ankit on how to better define this
    const tileWidth = Math.min(pageWidth - 20, pageHeight / 2 - 120);

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
                data={compressedTasks}
                contentContainerStyle={styles.content}
                keyExtractor={(task) => task.taskId}
                renderItem={({ item: task }) => {
                    const result = results[task.taskId];
                    const selectedOption = isDefined(result)
                        ? optionsByValue[result]
                        : undefined;

                    if (!task.url || !task.urlB) {
                        return null;
                    }
                    return (
                        <View
                            key={task.taskId}
                            style={styles.taskContent}
                        >
                            <Text colorVariant="brand">Before</Text>
                            <ImageTile
                                taskId={task.taskId}
                                url={task.url}
                                urlB={undefined}
                                width={tileWidth}
                                tintColor={selectedOption?.color}
                                onPress={handleTilePress}
                            />
                            <Text colorVariant="brand">After</Text>
                            <ImageTile
                                taskId={task.taskId}
                                url={task.urlB}
                                urlB={undefined}
                                width={tileWidth}
                                tintColor={selectedOption?.color}
                                onPress={handleTilePress}
                            />
                        </View>
                    );
                }}
                horizontal
                pagingEnabled
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                disableIntervalMomentum
                snapToOffsets={compressedTasks.map((_, i) => i * pageWidth)}
                viewabilityConfig={VIEWABILITY_CONFIG}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
            />
            {latitude && (
                <ScaleBar
                    latitude={latitude}
                    position="bottom"
                    referenceSize={tileWidth}
                    tileSize={tileWidth}
                    zoomLevel={projectDetails?.zoomLevel}
                    bottomPadding={0}
                />
            )}
            <ProgressBar
                currentValue={Math.floor(currentTaskIndex / 2) + 1}
                totalValue={Math.ceil(compressedTasks.length / 2)}
                colorVariant="brand"
            />
        </>
    );
}

export default CompareMappingSession;
