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
import { useTranslation } from 'react-i18next';
import {
    compareNumber,
    isDefined,
    isNotDefined,
    listToMap,
} from '@togglecorp/fujs';

import LocateTile from '@/components/domain/LocateTile';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import HideTileSelectionButton from '@/components/ui/HideTileSelectionButton';
import IconButton from '@/components/ui/IconButton';
import ScaleBar from '@/components/ui/map/ScaleBar';
import Pager, {
    type PageGeometry,
    type PagerPosition,
} from '@/components/ui/Pager';
import Positioned from '@/components/ui/Positioned';
import ProgressBar from '@/components/ui/ProgressBar';
import Row from '@/components/ui/Row';
import Spacer from '@/components/ui/Spacer';
import Stack from '@/components/ui/Stack';
import Surface from '@/components/ui/Surface';
import { LOCATE_DEFAULT_ANSWER_OPTIONS } from '@/constants/answers';
import useAnswerColors from '@/hooks/useAnswerColors';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useFittedTileWidth from '@/hooks/useFittedTileWidth';
import useViewport from '@/hooks/useViewport';
import { firebaseRef } from '@/utils/firebase';
import { buildTasks } from '@/utils/task';
import {
    type FbMappingGroupTileMapServiceCreateOnlyInput,
    type LocateFeaturesProject,
    type ResultOption,
    type Results,
    type TileTask,
} from '@/utils/types';

const TILE_RESERVE_INLINE = 20;

const TILE_ROWS = 2;

// Gap kept above the tile, so the selection controls bar never overlaps the imagery.
const CONTROLS_BAR_CLEARANCE = 16;

const OPTIONS_BAR_WIDTH_FRACTION = 0.92;

// Sentinel LocateTile reads as "leave the imagery bare"; ResultOption.color cannot be undefined.
const TRANSPARENT_ANSWER = 'transparent';

// Module level, so holding the hide-tiles button does not hand LocateTile a new map every render.
const NO_ANSWER_COLORS: Record<number, ResultOption> = {};

// Locate stores an array of cell values per task.
type CellResults = Record<string, number[]>;

interface LocateOption {
    value: number;
    label: string;
    // undefined leaves the imagery bare, which is what the "No" answer does.
    tintColor: string | undefined;
    dotColor: string | undefined;
}

interface Props {
    taskGroupId: string;
    projectDetails: LocateFeaturesProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
    completionPage: ReactNode;
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

    // Owned here, not by the pager, because "Go Back" on the outro sets it.
    const [pageIndex, setPageIndex] = useState(0);
    const [mode, setMode] = useState<'mapping' | 'selection'>('mapping');
    const [selectedCellsByTask, setSelectedCellsByTask] = useState<Record<string, number[]>>({});
    const [viewportHeight, setViewportHeight] = useState(0);

    const { t } = useTranslation('mappingSession');

    const {
        width: pageWidth,
        height: pageHeight,
    } = useViewport();

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

    const taskCount = tasks.length;

    // The pager appends the completion page after the tasks, so its index is the task count.
    const atCompletion = taskCount > 0 && pageIndex >= taskCount;
    const currentTaskIndex = Math.min(pageIndex, taskCount - 1);

    const builtInAnswerColors = useAnswerColors(LOCATE_DEFAULT_ANSWER_OPTIONS);

    const { customOptions } = projectDetails;

    const options = useMemo<LocateOption[]>(() => {
        if (isDefined(customOptions) && customOptions.length > 0) {
            return customOptions.map((option) => {
                // An author's 'transparent' means no fill, not a colour to paint.
                const color = option.iconColor === TRANSPARENT_ANSWER
                    ? undefined
                    : option.iconColor;

                return {
                    value: option.value,
                    label: option.title,
                    tintColor: color,
                    dotColor: color,
                };
            }).sort((a, b) => compareNumber(a.value, b.value));
        }

        // labelKey is not in public/locales yet, so defaultLabel is what renders.
        return LOCATE_DEFAULT_ANSWER_OPTIONS.map((option) => ({
            value: option.value,
            label: t(option.labelKey, option.defaultLabel),
            tintColor: builtInAnswerColors[option.value]?.tintColor,
            dotColor: builtInAnswerColors[option.value]?.badgeColor,
        }));
    }, [customOptions, builtInAnswerColors, t]);

    const optionsByValue = useMemo(() => (
        listToMap(
            options,
            ({ value }) => value,
            (option): ResultOption => ({
                value: option.value,
                label: option.label,
                color: option.tintColor ?? TRANSPARENT_ANSWER,
            }),
        )
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

    const handleIndexChange = useCallback((index: number, position: PagerPosition) => {
        setPageIndex(index);

        if (position.isTrailingPage) {
            onReachedEnd?.();
        }
    }, [onReachedEnd]);

    const handleGeometryChange = useCallback((geometry: PageGeometry) => {
        setViewportHeight(geometry.height);
    }, []);

    // Jump must stay instant: animating back from the outro renders every page in between.
    const handleOutroGoBack = useCallback(() => {
        setPageIndex(0);
    }, []);

    const tileWidth = useFittedTileWidth({
        availableInline: pageWidth,
        availableBlock: pageHeight,
        reserveInline: TILE_RESERVE_INLINE,
        rows: TILE_ROWS,
    });

    // The tile is centred, so its bottom edge sits at (viewportHeight + tileWidth) / 2.
    const optionsBarTop = (viewportHeight + tileWidth) / 2;
    // Mirrored above the tile; pageHeight stands in until the viewport is measured.
    const controlsBarHeight = Math.max(
        0,
        ((viewportHeight || pageHeight) - tileWidth) / 2 - CONTROLS_BAR_CLEARANCE,
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

    const selectTaskKey = useCallback((task: TileTask) => task.taskId, []);

    const renderTask = useCallback((task: TileTask) => {
        if (!task.url) {
            return null;
        }

        const existing = results[task.taskId];
        const cellValues = Array.isArray(existing)
            ? existing
            : new Array<number>(cellsPerTile).fill(defaultCellValue);
        const selectedCells = selectedCellsByTask[task.taskId] ?? [];

        return (
            <Stack
                spacing="none"
                grow="fill"
                align="center"
                justify="center"
            >
                <LocateTile
                    url={task.url}
                    width={tileWidth}
                    gridSize={gridSize}
                    cellValues={cellValues}
                    optionsByValue={hideTilePressValue ? NO_ANSWER_COLORS : optionsByValue}
                    selectedCells={selectedCells}
                    selectionMode={mode === 'selection'}
                    onCellPress={(cellIndex) => (
                        handleCellPress(task.taskId, cellIndex)
                    )}
                    onCellSelect={(cellIndex, action) => (
                        handleCellSelect(task.taskId, cellIndex, action)
                    )}
                />
                {/* Inside the centred group on purpose: it lifts the tile clear of the
                    controls below. */}
                <Spacer size="3xl" />
            </Stack>
        );
    }, [
        results,
        cellsPerTile,
        defaultCellValue,
        selectedCellsByTask,
        tileWidth,
        gridSize,
        hideTilePressValue,
        optionsByValue,
        mode,
        handleCellPress,
        handleCellSelect,
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
            <Positioned
                anchor="top"
                height={controlsBarHeight}
                align="end"
                justify="center"
                paddingInline="xs"
                paddingBlockEnd="3xs"
                layer="controls"
                hidden={atCompletion}
                // Full-width, so the corner controls underneath have to stay tappable.
                pointerEvents="box-none"
            >
                <Row spacing="sm">
                    {mode === 'mapping' && (
                        <IconButton
                            name="enter-selection"
                            iconName="selection"
                            accessibilityLabel={t('enterSelectionMode')}
                            colorVariant="onBrand"
                            onPress={handleEnterSelectionMode}
                        />
                    )}
                    {mode === 'selection' && (
                        <IconButton
                            name="exit-selection"
                            iconName="check"
                            accessibilityLabel={t('exitSelectionMode')}
                            colorVariant="onBrand"
                            onPress={handleExitSelectionMode}
                        />
                    )}
                </Row>
            </Positioned>
            <Pager
                sizeVariant="page"
                data={tasks}
                keyExtractor={selectTaskKey}
                renderPage={renderTask}
                renderTrailingPage={renderCompletionPage}
                index={pageIndex}
                onIndexChange={handleIndexChange}
                onGeometryChange={handleGeometryChange}
                // A drag across cells would otherwise be read as a page swipe.
                withPagingLocked={mode === 'selection'}
                scrollBehavior="instant"
            />
            {!atCompletion && (
                <>
                    {isDefined(latitude) && (
                        <Positioned
                            anchor="bottomStart"
                            offsetBlock="3xl"
                            offsetInline="3xs"
                        >
                            <ScaleBar
                                latitude={latitude}
                                referenceSize={tileWidth}
                                tileSize={tileWidth}
                                zoomLevel={projectDetails.zoomLevel}
                                inline
                            />
                        </Positioned>
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
            {mode === 'selection' && !atCompletion && (
                <Positioned
                    anchor="top"
                    offsetBlock={optionsBarTop}
                    align="center"
                    layer="controls"
                    // Spans the window, so it must not take touches meant for the corner controls.
                    pointerEvents="box-none"
                >
                    <Box maxWidth={pageWidth * OPTIONS_BAR_WIDTH_FRACTION}>
                        <Surface
                            styleVariant="outlined"
                            colorVariant="brand"
                            // The brand role carries no border colour of its own.
                            borderColorVariant="muted"
                            radius="lg"
                            paddingBlock="3xs"
                            paddingInline="2xs"
                        >
                            <Row
                                spacing="3xs"
                                justify="center"
                                wrap
                            >
                                {options.map((option) => (
                                    <Badge
                                        key={option.value}
                                        shape="pill"
                                        sizeVariant="md"
                                        colorVariant="onBrand"
                                        label={option.label}
                                        accessibilityLabel={option.label}
                                        onPress={() => handleApplyOptionToSelected(option.value)}
                                        disabled={selectedCount === 0}
                                    >
                                        {isDefined(option.dotColor) ? (
                                            <Badge
                                                sizeVariant="xs"
                                                dotColor={option.dotColor}
                                            />
                                        ) : (
                                            <Badge
                                                sizeVariant="xs"
                                                colorVariant="muted"
                                                styleVariant="swatch"
                                            />
                                        )}
                                    </Badge>
                                ))}
                            </Row>
                        </Surface>
                    </Box>
                </Positioned>
            )}
        </>
    );
}

export default LocateFeaturesMappingSession;
