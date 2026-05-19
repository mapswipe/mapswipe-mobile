import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import {
    compareNumber,
    isDefined,
    isNotDefined,
    listToMap,
} from '@togglecorp/fujs';
import {
    CheckIcon,
    SelectionIcon,
    SkipForwardIcon,
} from 'phosphor-react-native';

import Button from '@/components/Button';
import InlineListView from '@/components/InlineListView';
import LocateTile from '@/components/LocateTile';
import ProgressBar from '@/components/ProgressBar';
import ScaleBar from '@/components/ScaleBar';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseRef } from '@/utils/firebase';
import { buildTasks } from '@/utils/task';
import {
    FbMappingGroupTileMapServiceCreateOnlyInput,
    LocateFeaturesProject,
    ResultOption,
    Results,
} from '@/utils/types';

const createStyles = () => StyleSheet.create({
    content: {
        alignItems: 'center',
    },
    taskContent: {
        alignItems: 'center',
        width: SCREEN_WIDTH,
        paddingBottom: 40,
    },
    controls: {
        position: 'absolute',
        top: 10,
        right: 0,
        paddingHorizontal: 10,
        justifyContent: 'center',
        zIndex: 10,
        elevation: 10,
    },
});

const VIEWABILITY_CONFIG = {
    viewAreaCoveragePercentThreshold: 50,
};

// Locate features stores an array of cell values per task. CellResults is the
// locate-specific projection of the shared Results union.
type CellResults = Record<string, number[]>;

interface Props {
    taskGroupId: string;
    projectDetails: LocateFeaturesProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
    onSessionComplete: () => void;
}

function LocateFeaturesMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
        onSessionComplete,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [mode, setMode] = useState<'mapping' | 'selection'>('mapping');
    const [selectedCellsByTask, setSelectedCellsByTask] = useState<Record<string, number[]>>({});
    const completedRef = useRef(false);

    const theme = useTheme();
    const { t } = useTranslation('mappingSession');

    const styles = useThemedStyles(createStyles);

    const {
        width: pageWidth,
        height: pageHeight,
    } = useWindowDimensions();

    const gridSize = useMemo(() => (
        parseInt(projectDetails.subGridSize.split('x')[0], 10)
    ), [projectDetails.subGridSize]);

    const cellsPerTile = gridSize * gridSize;

    const taskGroupQuery = useMemo(() => (
        firebaseRef(`v2/groups/${projectDetails.projectId}/${taskGroupId}`)
    ), [taskGroupId, projectDetails.projectId]);

    const { data: groupDetails } = useFirebaseDatabase<
        FbMappingGroupTileMapServiceCreateOnlyInput
    >({
        query: taskGroupQuery,
    });

    const tasks = useMemo(() => {
        if (isNotDefined(groupDetails)) {
            return [];
        }
        return buildTasks(projectDetails, groupDetails);
    }, [groupDetails, projectDetails]);

    const options = useMemo<ResultOption[]>(() => {
        if (isDefined(projectDetails.customOptions) && projectDetails.customOptions.length > 0) {
            return projectDetails.customOptions.map((option) => ({
                value: option.value,
                label: option.title,
                color: option.iconColor,
            })).sort((a, b) => compareNumber(a.value, b.value));
        }

        return [
            { value: 0, label: 'No', color: 'transparent' },
            { value: 1, label: 'Yes', color: 'green' },
        ];
    }, [projectDetails.customOptions]);

    const optionsByValue = useMemo(() => (
        listToMap(options, ({ value }) => value)
    ), [options]);

    const defaultCellValue = options[0].value;

    const getNextValue = useCallback((value: number | undefined) => {
        if (isNotDefined(value)) {
            return defaultCellValue;
        }

        const optionIndex = options.findIndex(
            ({ value: optionValue }) => value === optionValue,
        );

        const nextIndex = optionIndex + 1;
        if (optionIndex === -1 || nextIndex >= options.length) {
            return options[0].value;
        }

        return options[nextIndex].value;
    }, [options, defaultCellValue]);

    useEffect(() => {
        if (tasks.length === 0) {
            return;
        }

        onResultsChange((prev) => {
            if (Object.keys(prev).length > 0) {
                return prev;
            }

            const seeded: CellResults = listToMap(
                tasks,
                ({ taskId }) => taskId,
                () => new Array<number>(cellsPerTile).fill(defaultCellValue),
            );

            return seeded;
        });
    }, [tasks, cellsPerTile, defaultCellValue, onResultsChange]);

    const handleCellPress = useCallback((taskId: string, cellIndex: number) => {
        onResultsChange((prev) => {
            const existing = prev[taskId];
            const prevCells = Array.isArray(existing)
                ? existing
                : new Array<number>(cellsPerTile).fill(defaultCellValue);
            const nextCells = [...prevCells];
            nextCells[cellIndex] = getNextValue(prevCells[cellIndex]);
            const next: CellResults = {
                ...(prev as CellResults),
                [taskId]: nextCells,
            };
            return next;
        });
    }, [getNextValue, onResultsChange, cellsPerTile, defaultCellValue]);

    const handleCellSelect = useCallback((
        taskId: string,
        cellIndex: number,
        action: 'select' | 'deselect',
    ) => {
        setSelectedCellsByTask((prev) => {
            const existing = prev[taskId] ?? [];
            const has = existing.includes(cellIndex);
            if (action === 'select' && has) {
                return prev;
            }
            if (action === 'deselect' && !has) {
                return prev;
            }
            const nextCells = action === 'select'
                ? [...existing, cellIndex]
                : existing.filter((idx) => idx !== cellIndex);
            return {
                ...prev,
                [taskId]: nextCells,
            };
        });
    }, []);

    const currentTaskId = tasks[currentTaskIndex]?.taskId;

    const handleEnterSelectionMode = useCallback(() => {
        setMode('selection');
    }, []);

    const handleExitSelectionMode = useCallback(() => {
        setMode('mapping');
        if (isDefined(currentTaskId)) {
            setSelectedCellsByTask((prev) => {
                if (isNotDefined(prev[currentTaskId])) {
                    return prev;
                }
                const next = { ...prev };
                delete next[currentTaskId];
                return next;
            });
        }
    }, [currentTaskId]);

    const handleCycleSelected = useCallback(() => {
        if (isNotDefined(currentTaskId)) {
            return;
        }
        const selected = selectedCellsByTask[currentTaskId] ?? [];
        if (selected.length === 0) {
            return;
        }
        onResultsChange((prev) => {
            const existing = prev[currentTaskId];
            const prevCells = Array.isArray(existing)
                ? existing
                : new Array<number>(cellsPerTile).fill(defaultCellValue);
            const nextCells = [...prevCells];
            selected.forEach((idx) => {
                nextCells[idx] = getNextValue(prevCells[idx]);
            });
            const next: CellResults = {
                ...(prev as CellResults),
                [currentTaskId]: nextCells,
            };
            return next;
        });
    }, [
        currentTaskId,
        selectedCellsByTask,
        onResultsChange,
        cellsPerTile,
        defaultCellValue,
        getNextValue,
    ]);

    const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / pageWidth);
        setCurrentTaskIndex(Math.min(pageIndex, tasks.length - 1));
    }, [pageWidth, tasks.length]);

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

    const tileWidth = Math.min(pageWidth - 20, pageHeight / 2);

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
            <View>
                <InlineListView
                    style={styles.controls}
                    spacing="sm"
                    withoutWrap
                >
                    {mode === 'mapping' && (
                        <Button
                            name="enter-selection"
                            accessibilityLabel={t('enterSelectionMode')}
                            styleVariant="action"
                            fullWidth={false}
                            onPress={handleEnterSelectionMode}
                        >
                            <SelectionIcon color={theme.textOnBrand} />
                        </Button>
                    )}
                    {mode === 'selection' && (
                        <>
                            <Button
                                name="cycle-selected"
                                accessibilityLabel={t('cycleSelectedCells')}
                                colorVariant="white"
                                styleVariant="action"
                                fullWidth={false}
                                onPress={handleCycleSelected}
                            >
                                <SkipForwardIcon color={theme.textOnBrand} />
                            </Button>
                            <Button
                                name="exit-selection"
                                accessibilityLabel={t('exitSelectionMode')}
                                colorVariant="primaryRed"
                                styleVariant="action"
                                fullWidth={false}
                                onPress={handleExitSelectionMode}
                            >
                                <CheckIcon color={theme.textOnBrand} />
                            </Button>
                        </>
                    )}
                </InlineListView>
            </View>
            <FlatList
                data={tasks}
                contentContainerStyle={styles.content}
                keyExtractor={(task) => task.taskId}
                renderItem={({ item: task }) => {
                    if (!task.url) {
                        return null;
                    }
                    const existing = results[task.taskId];
                    const cellValues = Array.isArray(existing)
                        ? existing
                        : new Array<number>(cellsPerTile).fill(defaultCellValue);
                    const selectedCells = selectedCellsByTask[task.taskId] ?? [];

                    return (
                        <View
                            key={task.taskId}
                            style={styles.taskContent}
                        >
                            <LocateTile
                                url={task.url}
                                width={tileWidth}
                                gridSize={gridSize}
                                cellValues={cellValues}
                                optionsByValue={optionsByValue}
                                selectedCells={selectedCells}
                                selectionMode={mode === 'selection'}
                                onCellPress={(cellIndex) => (
                                    handleCellPress(task.taskId, cellIndex)
                                )}
                                onCellSelect={(cellIndex, action) => (
                                    handleCellSelect(task.taskId, cellIndex, action)
                                )}
                            />
                        </View>
                    );
                }}
                horizontal
                pagingEnabled
                scrollEnabled={mode !== 'selection'}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                disableIntervalMomentum
                snapToOffsets={tasks.map((_, i) => i * pageWidth)}
                viewabilityConfig={VIEWABILITY_CONFIG}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEventThrottle={16}
                windowSize={3}
                initialNumToRender={2}
            />
            {latitude && (
                <ScaleBar
                    latitude={latitude}
                    position="bottom"
                    referenceSize={tileWidth}
                    tileSize={tileWidth}
                    zoomLevel={projectDetails.zoomLevel}
                    bottomPadding={40}
                />
            )}
            <ProgressBar
                currentValue={currentTaskIndex + 1}
                totalValue={tasks.length}
                colorVariant="brand"
            />
        </>
    );
}

export default LocateFeaturesMappingSession;
