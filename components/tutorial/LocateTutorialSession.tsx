import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    isNotDefined,
    listToGroupList,
    listToMap,
    mapToList,
} from '@togglecorp/fujs';

import LocateTile from '@/components/domain/LocateTile';
import { TutorialSessionProps } from '@/components/tutorial/types';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import Surface from '@/components/ui/Surface';
import { LOCATE_DEFAULT_ANSWER_OPTIONS } from '@/constants/answers';
import useAnswerColors from '@/hooks/useAnswerColors';
import useFittedTileWidth from '@/hooks/useFittedTileWidth';
import useViewport from '@/hooks/useViewport';
import { TileTutorialTask } from '@/utils/tutorial';
import {
    ResultOption,
    Results,
} from '@/utils/types';

// ResultOption.color is a required string, so "tints nothing" needs a value.
const NO_TINT = 'transparent';

const MIN_TILE_WIDTH = 120;

// Fallback before onLayout: a 12pt gutter each side.
const FALLBACK_INLINE_CHROME = 24;

const FALLBACK_BLOCK_FRACTION = 0.6;

const OPTIONS_BAR_MAX_WIDTH_FRACTION = 0.92;

type LocateTutorialCellTask = TileTutorialTask & {
    taskPartitionIndex: number;
    taskId_real: string;
    url: string;
};

function LocateTutorialSession(props: TutorialSessionProps) {
    const {
        tutorial,
        tasks,
        results,
        onResultsChange,
        disabled,
        projectCustomOptions,
    } = props;

    const { width: pageWidth, height: pageHeight } = useViewport();
    const { t } = useTranslation('mappingSession');

    const [mode, setMode] = useState<'mapping' | 'selection'>('mapping');
    const [selectedCellsByTile, setSelectedCellsByTile] = useState<Record<string, number[]>>({});
    const [tileSlotSize, setTileSlotSize] = useState({ width: 0, height: 0 });

    const defaultAnswerColors = useAnswerColors(LOCATE_DEFAULT_ANSWER_OPTIONS);

    const options = useMemo<ResultOption[]>(() => {
        if (projectCustomOptions && projectCustomOptions.length > 0) {
            return [...projectCustomOptions]
                .sort((a, b) => a.value - b.value)
                .map((option) => ({
                    value: option.value,
                    label: option.title,
                    color: option.iconColor,
                }));
        }
        return LOCATE_DEFAULT_ANSWER_OPTIONS.map((option) => ({
            value: option.value,
            // ANSWER_OPTIONS carries a labelKey too, but public/locales has no entry for it yet.
            label: option.defaultLabel,
            color: defaultAnswerColors[option.value]?.tintColor ?? NO_TINT,
        }));
    }, [projectCustomOptions, defaultAnswerColors]);

    const optionsByValue = useMemo(() => (
        listToMap(options, ({ value }) => value)
    ), [options]);

    const defaultCellValue = options[0].value;

    const getNextValue = useCallback((value: number | undefined) => {
        if (isNotDefined(value)) {
            return defaultCellValue;
        }
        const optionIndex = options.findIndex(({ value: v }) => value === v);
        const nextIndex = optionIndex + 1;
        if (optionIndex === -1 || nextIndex >= options.length) {
            return options[0].value;
        }
        return options[nextIndex].value;
    }, [options, defaultCellValue]);

    const gridSize = useMemo(() => {
        if ('subGridSize' in tutorial && typeof tutorial.subGridSize === 'string') {
            return parseInt(tutorial.subGridSize.split('x')[0], 10);
        }
        return 2;
    }, [tutorial]);

    const cellsPerTile = gridSize * gridSize;

    // Many per-cell tasks share one tile id, each holding its cell's answer at taskPartitionIndex.
    const tileGroups = useMemo(() => {
        const cellTasks = tasks.filter((task): task is LocateTutorialCellTask => (
            'taskId_real' in task && typeof task.taskId_real === 'string'
            && 'taskPartitionIndex' in task && typeof task.taskPartitionIndex === 'number'
            && 'url' in task && typeof task.url === 'string'
        ));
        const grouped = listToGroupList(cellTasks, (task) => task.taskId_real);
        return mapToList(grouped, (groupTasks, tileKey) => ({
            tileKey,
            url: groupTasks[0]?.url,
            tasks: groupTasks,
        }));
    }, [tasks]);

    useEffect(() => {
        if (tileGroups.length === 0) {
            return;
        }
        onResultsChange((prev) => {
            const missing = tileGroups.filter((g) => !(g.tileKey in prev));
            if (missing.length === 0) {
                return prev;
            }
            const next: Results = { ...prev };
            missing.forEach((g) => {
                next[g.tileKey] = new Array<number>(cellsPerTile).fill(defaultCellValue);
            });
            return next;
        });
    }, [tileGroups, cellsPerTile, defaultCellValue, onResultsChange]);

    const handleCellPress = useCallback((tileKey: string, cellIndex: number) => {
        if (disabled) {
            return;
        }
        onResultsChange((prev) => {
            const existing = prev[tileKey];
            const prevCells = Array.isArray(existing)
                ? existing
                : new Array<number>(cellsPerTile).fill(defaultCellValue);
            const nextCells = [...prevCells];
            nextCells[cellIndex] = getNextValue(prevCells[cellIndex]);
            return {
                ...prev,
                [tileKey]: nextCells,
            };
        });
    }, [disabled, onResultsChange, getNextValue, cellsPerTile, defaultCellValue]);

    const handleCellSelect = useCallback((
        tileKey: string,
        cellIndex: number,
        action: 'select' | 'deselect',
    ) => {
        setSelectedCellsByTile((prev) => {
            const existing = prev[tileKey] ?? [];
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
                [tileKey]: nextCells,
            };
        });
    }, []);

    const effectiveSelectionMode = mode === 'selection' && !disabled;

    const handleEnterSelectionMode = useCallback(() => {
        setMode('selection');
    }, []);

    const handleExitSelectionMode = useCallback(() => {
        setMode('mapping');
        setSelectedCellsByTile({});
    }, []);

    const handleApplyOptionToSelected = useCallback((value: number) => {
        const tilesWithSelection = Object.entries(selectedCellsByTile)
            .filter(([, cells]) => cells.length > 0);
        if (tilesWithSelection.length === 0) {
            return;
        }
        onResultsChange((prev) => {
            const next: Results = { ...prev };
            tilesWithSelection.forEach(([tileKey, cells]) => {
                const existing = prev[tileKey];
                const prevCells = Array.isArray(existing)
                    ? existing
                    : new Array<number>(cellsPerTile).fill(defaultCellValue);
                const nextCells = [...prevCells];
                cells.forEach((idx) => {
                    nextCells[idx] = value;
                });
                next[tileKey] = nextCells;
            });
            return next;
        });
        setSelectedCellsByTile({});
    }, [selectedCellsByTile, onResultsChange, cellsPerTile, defaultCellValue]);

    const selectedCount = useMemo(
        () => Object.values(selectedCellsByTile)
            .reduce((sum, cells) => sum + cells.length, 0),
        [selectedCellsByTile],
    );

    const tileWidth = useFittedTileWidth({
        availableInline: tileSlotSize.width,
        availableBlock: tileSlotSize.height,
        fallbackInline: pageWidth - FALLBACK_INLINE_CHROME,
        fallbackBlock: pageHeight * FALLBACK_BLOCK_FRACTION,
        minSize: MIN_TILE_WIDTH,
    });

    const optionsBarMaxWidth = tileSlotSize.width > 0
        ? tileSlotSize.width * OPTIONS_BAR_MAX_WIDTH_FRACTION
        : undefined;

    return (
        <Stack
            spacing="2xs"
            grow="slot"
        >
            {!disabled && (
                <Box selfAlign="end">
                    <Row spacing="sm">
                        {mode === 'mapping' && (
                            <Button
                                name="enter-selection"
                                accessibilityLabel={t('enterSelectionMode')}
                                styleVariant="transparent"
                                colorVariant="onBrand"
                                width="hug"
                                onPress={handleEnterSelectionMode}
                            >
                                <Icon
                                    name="selection"
                                    sizeVariant="2xl"
                                    colorVariant="onBrand"
                                />
                            </Button>
                        )}
                        {mode === 'selection' && (
                            <Button
                                name="exit-selection"
                                accessibilityLabel={t('exitSelectionMode')}
                                colorVariant="negative"
                                styleVariant="transparent"
                                width="hug"
                                onPress={handleExitSelectionMode}
                            >
                                <Icon
                                    name="check"
                                    sizeVariant="2xl"
                                    colorVariant="onBrand"
                                />
                            </Button>
                        )}
                    </Row>
                </Box>
            )}
            {/* minHeight 0 plus clip stop the tile pushing the controls off a short window. */}
            <Box
                flex={1}
                minHeight={0}
                clip
                align="center"
                justify="center"
                onLayout={(event) => setTileSlotSize(event.nativeEvent.layout)}
            >
                {tileGroups.map((group) => {
                    if (isNotDefined(group.url)) {
                        return null;
                    }
                    const existing = results[group.tileKey];
                    const baseCells = Array.isArray(existing) ? existing : [];
                    const cellValues: number[] = [];
                    for (let i = 0; i < cellsPerTile; i += 1) {
                        cellValues.push(baseCells[i] ?? defaultCellValue);
                    }
                    const validCells = new Set<number>();
                    group.tasks.forEach((task) => {
                        const idx = task.taskPartitionIndex;
                        if (idx >= 0 && idx < cellsPerTile) {
                            validCells.add(idx);
                        }
                    });
                    const selectedCells = selectedCellsByTile[group.tileKey] ?? [];
                    return (
                        <LocateTile
                            key={group.tileKey}
                            url={group.url}
                            width={tileWidth}
                            gridSize={gridSize}
                            cellValues={cellValues}
                            optionsByValue={optionsByValue}
                            selectedCells={selectedCells}
                            selectionMode={effectiveSelectionMode}
                            isCellInteractive={(cellIndex) => (
                                !disabled && validCells.has(cellIndex)
                            )}
                            onCellPress={(cellIndex) => (
                                handleCellPress(group.tileKey, cellIndex)
                            )}
                            onCellSelect={(cellIndex, action) => (
                                handleCellSelect(group.tileKey, cellIndex, action)
                            )}
                        />
                    );
                })}
            </Box>
            {effectiveSelectionMode && (
                <Box
                    align="center"
                    pointerEvents="box-none"
                >
                    <Box maxWidth={optionsBarMaxWidth}>
                        <Surface
                            styleVariant="outlined"
                            colorVariant="brand"
                            borderColorVariant="secondary"
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
                                        disabled={selectedCount === 0}
                                        onPress={() => handleApplyOptionToSelected(option.value)}
                                    >
                                        {option.color === NO_TINT ? (
                                            <Badge
                                                sizeVariant="xs"
                                                styleVariant="swatch"
                                                colorVariant="muted"
                                            />
                                        ) : (
                                            <Badge
                                                sizeVariant="xs"
                                                dotColor={option.color}
                                            />
                                        )}
                                    </Badge>
                                ))}
                            </Row>
                        </Surface>
                    </Box>
                </Box>
            )}
        </Stack>
    );
}

export default LocateTutorialSession;
