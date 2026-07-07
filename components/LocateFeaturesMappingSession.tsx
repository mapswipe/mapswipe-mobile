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
import { useTranslation } from 'react-i18next';
import {
    FlatList,
    StyleSheet,
    TouchableOpacity,
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
} from 'phosphor-react-native';

import Button from '@/components/Button';
import InlineListView from '@/components/InlineListView';
import LocateTile from '@/components/LocateTile';
import ProgressBar from '@/components/ProgressBar';
import ScaleBar from '@/components/ScaleBar';
import Text from '@/components/Text';
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

import HideTileSelectionButton from './HideTileSelectionButton';

const createStyles = () => StyleSheet.create({
    content: {
        alignItems: 'center',
    },
    taskContent: {
        alignItems: 'center',
        width: SCREEN_WIDTH,
        paddingBottom: 40,
    },
    // Fill the content area so the tile is genuinely vertically centered and the
    // measured height equals the full viewport (the bars are positioned against
    // it). Without this the list is content-sized and the bars sit too high.
    list: {
        flex: 1,
        width: '100%',
    },
    // Selection controls (enter / done) sit just above the centered tile, top-
    // right aligned, mirroring the options bar below it. The bar spans the gap
    // above the tile and bottom-aligns its content.
    controlsBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        paddingBottom: 8,
        paddingHorizontal: 16,
        zIndex: 20,
        elevation: 20,
    },
    // Hide the selection-mode controls on the completion page.
    hidden: {
        display: 'none',
    },
    // Floating, centered options bar shown in selection mode. The container is
    // full-width but box-none so the corner chrome stays tappable; only the
    // centered pill receives touches.
    optionsBarContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 20,
        elevation: 20,
    },
    optionsBar: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        maxWidth: '92%',
    },
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 999,
    },
    optionDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
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
    // Project completion screen, rendered as the final swipeable page.
    completionPage: ReactNode;
    // Fired once the user scrolls onto the completion page (mapping finished).
    onReachedEnd?: () => void;
}

function LocateFeaturesMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
        completionPage,
        onReachedEnd,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [mode, setMode] = useState<'mapping' | 'selection'>('mapping');
    const [selectedCellsByTask, setSelectedCellsByTask] = useState<Record<string, number[]>>({});
    // True while the swipeable completion page is showing, so the session
    // chrome (scale bar, progress bar, hide-tiles button) can be hidden there.
    const [atCompletion, setAtCompletion] = useState(false);
    // Height of the scroll viewport, so the completion page can fill it and
    // anchor its action buttons to the bottom.
    const [viewportHeight, setViewportHeight] = useState(0);

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

    const flatListRef = useRef<FlatList<typeof tasks[number]>>(null);

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

    // Applies the chosen option's value to every selected cell, then clears the
    // selection so the next batch can be selected fresh.
    const handleApplyOptionToSelected = useCallback((value: number) => {
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
                nextCells[idx] = value;
            });
            const next: CellResults = {
                ...(prev as CellResults),
                [currentTaskId]: nextCells,
            };
            return next;
        });
        setSelectedCellsByTask((prev) => {
            if (isNotDefined(prev[currentTaskId])) {
                return prev;
            }
            const next = { ...prev };
            delete next[currentTaskId];
            return next;
        });
    }, [
        currentTaskId,
        selectedCellsByTask,
        onResultsChange,
        cellsPerTile,
        defaultCellValue,
    ]);

    const selectedCount = isDefined(currentTaskId)
        ? (selectedCellsByTask[currentTaskId]?.length ?? 0)
        : 0;

    const handleScroll = useCallback((event: { nativeEvent: { contentOffset: { x: number } } }) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / pageWidth);
        setCurrentTaskIndex(Math.min(pageIndex, tasks.length - 1));
        const onCompletionPage = pageIndex >= tasks.length;
        setAtCompletion(onCompletionPage);
        if (onCompletionPage) {
            onReachedEnd?.();
        }
    }, [pageWidth, tasks.length, onReachedEnd]);

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

    const tileWidth = Math.min(pageWidth - 20, pageHeight / 2);
    // The tile is vertically centered in the viewport, so its bottom edge sits
    // at (viewportHeight + tileHeight) / 2. Anchor the options bar just below
    // it, clear of the scale bar / progress bar / hide-tiles button.
    const optionsBarTop = (viewportHeight + tileWidth) / 2;
    // Mirror that above the tile: the controls bar spans the gap above the tile
    // (height = the top gap) with its content bottom-aligned, so the selection
    // controls sit just above the tile. Fall back to pageHeight before the
    // viewport is measured so the control is visible from the first frame.
    const controlsBarHeight = Math.max(
        0,
        ((viewportHeight || pageHeight) - tileWidth) / 2 - 16,
    );

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

    return (
        <>
            <View
                style={StyleSheet.flatten([
                    styles.controlsBar,
                    { height: controlsBarHeight },
                    atCompletion && styles.hidden,
                ])}
                pointerEvents="box-none"
            >
                <InlineListView
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
                    )}
                </InlineListView>
            </View>
            <FlatList
                ref={flatListRef}
                data={tasks}
                style={styles.list}
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
                                optionsByValue={
                                    hideTilePressValue
                                        ? {} as Record<number, ResultOption> : optionsByValue
                                }
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
                onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
                ListFooterComponent={tasks.length > 0 ? (
                    <View
                        style={StyleSheet.flatten({
                            width: SCREEN_WIDTH,
                            height: viewportHeight || undefined,
                        })}
                    >
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
                ) : null}
                horizontal
                pagingEnabled
                scrollEnabled={mode !== 'selection'}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                disableIntervalMomentum
                snapToOffsets={Array.from(
                    { length: tasks.length + 1 },
                    (_, i) => i * pageWidth,
                )}
                viewabilityConfig={VIEWABILITY_CONFIG}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                windowSize={3}
                initialNumToRender={2}
            />
            {!atCompletion && (
                <>
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
                    <HideTileSelectionButton
                        handleHideTileSelectionPressIn={handleHideTilePressIn}
                        handleHideTileSelectionPressOut={handleHideTilePressOut}
                        isPressed={hideTilePressValue}
                    />
                    <ProgressBar
                        currentValue={currentTaskIndex + 1}
                        totalValue={tasks.length}
                        colorVariant="brand"
                    />
                </>
            )}
            {mode === 'selection' && !atCompletion && (
                <View
                    style={StyleSheet.flatten([
                        styles.optionsBarContainer,
                        { top: optionsBarTop },
                    ])}
                    pointerEvents="box-none"
                >
                    <View
                        style={StyleSheet.flatten([
                            styles.optionsBar,
                            {
                                backgroundColor: theme.backgroundBrand,
                                borderColor: theme.divider,
                            },
                        ])}
                    >
                        {options.map((option) => {
                            const dotColor = option.color === 'transparent'
                                ? theme.textMuted
                                : option.color;
                            return (
                                <TouchableOpacity
                                    key={option.value}
                                    style={StyleSheet.flatten([
                                        styles.optionChip,
                                        {
                                            backgroundColor: theme.inputBrandBackground,
                                            opacity: selectedCount === 0 ? 0.5 : 1,
                                        },
                                    ])}
                                    onPress={() => handleApplyOptionToSelected(option.value)}
                                    disabled={selectedCount === 0}
                                    accessibilityRole="button"
                                    accessibilityLabel={option.label}
                                >
                                    <View
                                        style={StyleSheet.flatten([
                                            styles.optionDot,
                                            { backgroundColor: dotColor },
                                        ])}
                                    />
                                    <Text variant="label" colorVariant="brand">
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            )}
        </>
    );
}

export default LocateFeaturesMappingSession;
