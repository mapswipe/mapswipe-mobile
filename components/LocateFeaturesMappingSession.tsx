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

import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import LocateTile from '@/components/LocateTile';
import ScaleBar from '@/components/ScaleBar';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
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

/**
 * Inline chrome the tile does not get: a 10pt gutter on each side, so 20 for the pair. It has
 * to be stated as the pair, because that is what useFittedTileWidth takes off the page before
 * it divides.
 */
const TILE_RESERVE_INLINE = 20;

const TILE_ROWS = 2;

/**
 * Gap kept between the bottom of the selection-controls bar and the top of the tile. The bar is
 * sized to the space above the tile less this, so it never overlaps the imagery.
 */
const CONTROLS_BAR_CLEARANCE = 16;

const OPTIONS_BAR_WIDTH_FRACTION = 0.92;

/**
 * What LocateTile paints onto a cell whose answer has no colour of its own. A sentinel and not
 * a token: ResultOption.color is a required string, and the tile leaf has always taken this
 * exact word to mean "leave the imagery bare".
 */
const TRANSPARENT_ANSWER = 'transparent';

/** Frozen, so holding the hide-tiles button does not hand LocateTile a new map every render. */
const NO_ANSWER_COLORS: Record<number, ResultOption> = {};

// Locate features stores an array of cell values per task. CellResults is the
// locate-specific projection of the shared Results union.
type CellResults = Record<string, number[]>;

/**
 * An answer as this session needs it, and the one place the two colour sources are reconciled.
 *
 * A project's own `customOptions` are Firebase author data: `iconColor` is an arbitrary string
 * that can never be a theme token. A project that ships none falls back to the two built-in
 * locate answers, whose colours are tokens and are resolved through useAnswerColors, the bridge
 * that exists because LocateTile has not moved into components/ui yet and still takes a colour
 * string. Conflating the two would route author data through the token table, or paint a token
 * answer in whatever colour a project happened to publish.
 */
interface LocateOption {
    value: number;
    label: string;
    /** Cell tint. `undefined` leaves the imagery bare, which is what the "No" answer does. */
    tintColor: string | undefined;
    /** Fill for the chip's leading dot, or `undefined` for the muted swatch. */
    dotColor: string | undefined;
}

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

    // The page showing now, counted the way the pager reports it: the tasks first, then the
    // completion page. Held here rather than left to the pager because "Go Back" on the outro
    // sets it.
    const [pageIndex, setPageIndex] = useState(0);
    const [mode, setMode] = useState<'mapping' | 'selection'>('mapping');
    const [selectedCellsByTask, setSelectedCellsByTask] = useState<Record<string, number[]>>({});
    // Height of the scroll viewport, so the completion page can fill it and the floating bars
    // can be anchored against it.
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
                // The author's own sentinel for a colourless answer, handled here so a backend
                // 'transparent' reaches the chip as the muted swatch rather than as a raw fill.
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

        // labelKey is not in public/locales yet, so defaultLabel is what renders: the same
        // hardcoded 'No' / 'Yes' the fallback list shipped before, now translatable.
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

    const handleIndexChange = useCallback((index: number, position: PagerPosition) => {
        setPageIndex(index);

        if (position.isTrailingPage) {
            onReachedEnd?.();
        }
    }, [onReachedEnd]);

    const handleGeometryChange = useCallback((geometry: PageGeometry) => {
        setViewportHeight(geometry.height);
    }, []);

    // "Go Back" on the outro returns to the first task so the user reviews the
    // group from the start. The jump is instant (not animated): animating all
    // the way back from the completion page would render every intermediate
    // page and is what made repeated go-backs unstable.
    const handleOutroGoBack = useCallback(() => {
        setPageIndex(0);
    }, []);

    const tileWidth = useFittedTileWidth({
        availableInline: pageWidth,
        availableBlock: pageHeight,
        reserveInline: TILE_RESERVE_INLINE,
        rows: TILE_ROWS,
    });

    // The tile is vertically centered in the viewport, so its bottom edge sits
    // at (viewportHeight + tileHeight) / 2. Anchor the options bar just below
    // it, clear of the scale bar / progress bar / hide-tiles button.
    const optionsBarTop = (viewportHeight + tileWidth) / 2;
    // Mirror that above the tile: the controls bar spans the gap above the tile
    // (height = the top gap, less the clearance), so the selection controls sit
    // in the band above the imagery. Fall back to pageHeight before the viewport
    // is measured, so the control is visible from the first frame.
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
                {/* Below the tile and inside the centred group, so the pair is what gets
                    centred: the tile ends up half a rung above the viewport's middle, clear
                    of the scale bar and the progress bar. This is the page's 40pt bottom
                    padding, which a centring parent spent the same way. */}
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
                layer="chrome"
                // Hide the selection-mode controls on the completion page, without unmounting.
                hidden={atCompletion}
                // Full-width, so the corner chrome underneath has to stay tappable.
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
                // Holds the user on the tile while cells are being dragged out, where a swipe
                // would otherwise be read as paging.
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
                    layer="chrome"
                    // Spans the window so the pill can centre in it, so it must not take the
                    // touches meant for the corner chrome beside it.
                    pointerEvents="box-none"
                >
                    <Box maxWidth={pageWidth * OPTIONS_BAR_WIDTH_FRACTION}>
                        <Surface
                            styleVariant="outlined"
                            colorVariant="brand"
                            // The hairline is the theme's divider, which the brand role's own
                            // border slot does not carry.
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
