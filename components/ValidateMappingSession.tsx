import {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    View,
} from 'react-native';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { decode } from 'base-64';
import { inflate } from 'pako';

import BlockListView from '@/components/BlockListView';
import InlineListView from '@/components/InlineListView';
import MapTile from '@/components/MapTile';
import ProgressBar from '@/components/ProgressBar';
import ScaleBar from '@/components/ScaleBar';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import {
    getBbox,
    getOptimalZoomLevel,
} from '@/utils/geo';
import {
    FeatureGeoJson,
    Results,
    ValidateProject,
    ValidateTask,
} from '@/utils/types';

import HideTileSelectionButton from './HideTileSelectionButton';
import { type IconName } from './Icon';
import IconButton from './IconButton';

type RefType = FlatList<ValidateTask> | null;
const viewabilityConfig = {
    viewAreaCoveragePercentThreshold: 50,
};

const styles = StyleSheet.create({
    view: {
        flex: 1,
        flexDirection: 'column',
    },
    tileArea: {
        flex: 1,
    },
    tasks: {
        flex: 2,
        flexGrow: 1,
        width: SCREEN_WIDTH,
    },
    task: {
        width: SCREEN_WIDTH,
        padding: 20,
    },
    scaleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 20,
    },
    scaleBarArea: {
        flex: 1,
    },
    hideButtonWrapper: {
        paddingRight: 6,
    },
    buttons: {
        flexGrow: 0,
        flexShrink: 0,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

interface Props {
    taskGroupId: string;
    projectDetails: ValidateProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
    onSessionComplete: () => void;
}

function ValidateMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
        onSessionComplete,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [hideTilePressValue, setHideTilePressValue] = useState(false);
    const completedRef = useRef(false);

    const taskQuery = useMemo(() => (
        firebaseRef(`v2/tasks/${projectDetails.projectId}/${taskGroupId}`)
    ), [projectDetails.projectId, taskGroupId]);

    const { data: compressedTasks } = useFirebaseDatabase<string>({
        query: taskQuery,
    });

    const taskList = useMemo(() => {
        if (isNotDefined(compressedTasks)) {
            return [] as ValidateTask[];
        }
        if (Array.isArray(compressedTasks)) {
            return compressedTasks as ValidateTask[];
        }
        if (typeof compressedTasks !== 'string') {
            return [];
        }

        const decodedStr = decode(compressedTasks);
        const charList = decodedStr.split('').map((splitteStr) => splitteStr.charCodeAt(0));
        const binaryCompressedTasks = new Uint8Array(charList);
        const decompressedTasks = inflate(binaryCompressedTasks, { to: 'string' });

        // FIXME: add schema validation
        return JSON.parse(decompressedTasks) as ValidateTask[];
    }, [compressedTasks]);

    const currentTask = taskList[currentTaskIndex] as ValidateTask | undefined;
    const options = projectDetails.customOptions;
    const maxTasks = taskList.length;

    const flatListRef = useRef<RefType>(null);

    const handleAnswerSelect = useCallback((newValue: number) => {
        if (isDefined(currentTask)) {
            onResultsChange((prevResults) => ({
                ...prevResults,
                [currentTask.taskId]: newValue,
            }));
        }

        const nextIndex = currentTaskIndex + 1;
        if (nextIndex < maxTasks) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
            }, 0);
        } else if (!completedRef.current) {
            completedRef.current = true;
            onSessionComplete();
        }
    }, [currentTask, onResultsChange, maxTasks, currentTaskIndex, onSessionComplete]);

    const selectedValue = isDefined(currentTask)
        ? results[currentTask.taskId]
        : undefined;

    const onViewableItemsChanged = useCallback(({
        viewableItems,
    }: { viewableItems: { index: number | null | undefined }[] }) => {
        if (viewableItems.length > 0) {
            const { index } = viewableItems[0];
            if (index !== undefined && index !== null) {
                setCurrentTaskIndex(index);
            }
        }
    }, []);

    let totalSwipedTasks = 0;
    if (results) {
        totalSwipedTasks = Object.keys(results).length;
        if ('startTime' in results) {
            totalSwipedTasks -= 1;
        }
    }

    const limitedTasks = [...(taskList ?? [])].slice(0, totalSwipedTasks + 1);

    // After "Go back" from the outro the session re-mounts at the first task
    // with all answers intact; re-show the outro once the user swipes back to
    // the final task. (The initial pass completes via handleAnswerSelect.)
    useEffect(() => {
        if (
            maxTasks > 1
            && currentTaskIndex === maxTasks - 1
            && totalSwipedTasks >= maxTasks
            && !completedRef.current
        ) {
            completedRef.current = true;
            onSessionComplete();
        }
    }, [currentTaskIndex, maxTasks, totalSwipedTasks, onSessionComplete]);

    const currentBbox = useMemo(
        () => (isDefined(currentTask?.geojson)
            ? getBbox(currentTask.geojson as FeatureGeoJson)
            : undefined),
        [currentTask],
    );

    const latitude = useMemo(
        () => (isDefined(currentBbox)
            ? (currentBbox[1] + currentBbox[3]) / 2
            : undefined),
        [currentBbox],
    );

    const zoomLevel = useMemo(
        () => (isDefined(currentBbox)
            ? getOptimalZoomLevel(currentBbox)
            : undefined),
        [currentBbox],
    );

    const tileWidth = SCREEN_WIDTH - 40;

    const handleHideTilePressIn = useCallback(() => {
        setHideTilePressValue(true);
    }, []);

    const handleHideTilePressOut = useCallback(() => {
        setHideTilePressValue(false);
    }, []);

    const disableOptions = currentTaskIndex === undefined || currentTaskIndex === -1;

    if (!currentTask?.geojson) {
        return (
            <BlockListView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </BlockListView>
        );
    }

    return (
        <BlockListView style={styles.view}>
            <View style={styles.tileArea}>
                <FlatList
                    style={styles.tasks}
                    ref={flatListRef}
                    data={limitedTasks}
                    keyExtractor={(_, index) => index.toString()}
                    extraData={hideTilePressValue}
                    renderItem={({ item }) => (
                        <View style={styles.task}>
                            <MapTile
                                geoJson={item.geojson as FeatureGeoJson}
                                tileServer={projectDetails.tileServer}
                                hideLines={hideTilePressValue}
                            />
                        </View>
                    )}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={viewabilityConfig}
                    horizontal
                    getItemLayout={(_, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                />
            </View>
            <View style={styles.scaleRow}>
                <View style={styles.scaleBarArea}>
                    {isDefined(latitude) && isDefined(zoomLevel) && (
                        <ScaleBar
                            latitude={latitude}
                            referenceSize={tileWidth}
                            tileSize={tileWidth}
                            zoomLevel={zoomLevel}
                            inline
                        />
                    )}
                </View>
                <View style={styles.hideButtonWrapper}>
                    <HideTileSelectionButton
                        handleHideTileSelectionPressIn={handleHideTilePressIn}
                        handleHideTileSelectionPressOut={handleHideTilePressOut}
                        isPressed={hideTilePressValue}
                    />
                </View>
            </View>
            <InlineListView
                withCenteredContent
                style={styles.buttons}
            >
                {options?.map((option) => (
                    <IconButton
                        name={option.value}
                        key={option.value}
                        title={option.title}
                        onPress={handleAnswerSelect}
                        width={50}
                        // FIXME: No casting
                        iconName={option.icon as IconName}
                        tintColor={option.iconColor}
                        active={selectedValue === option.value}
                        disabled={disableOptions}
                        textColorVariant="brand"
                    />
                ))}
            </InlineListView>
            <ProgressBar
                currentValue={totalSwipedTasks}
                totalValue={maxTasks}
                colorVariant="brand"
            />
        </BlockListView>
    );
}

export default ValidateMappingSession;
