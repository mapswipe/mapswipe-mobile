import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import {
    isNotDefined,
    listToGroupList,
    listToMap,
    mapToList,
} from '@togglecorp/fujs';
import {
    CheckIcon,
    SelectionIcon,
} from 'phosphor-react-native';

import Button from '@/components/Button';
import InlineListView from '@/components/InlineListView';
import LocateTile from '@/components/LocateTile';
import Text from '@/components/Text';
import { TutorialSessionProps } from '@/components/tutorial/types';
import useTheme from '@/hooks/useTheme';
import { TileTutorialTask } from '@/utils/tutorial';
import {
    ResultOption,
    Results,
} from '@/utils/types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 0,
        gap: 12,
    },
    controls: {
        flexGrow: 0,
        flexShrink: 0,
        alignSelf: 'flex-end',
    },
    // The tile fills this slot; minHeight:0 + overflow:hidden keep it from
    // overflowing the controls/Check Answer button when the window is short.
    tileSlot: {
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Centered options bar shown in selection mode, mirroring the mapping
    // session: pick an option to apply it to every selected cell.
    optionsBarContainer: {
        flexGrow: 0,
        flexShrink: 0,
        alignItems: 'center',
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

const DEFAULT_OPTIONS: ResultOption[] = [
    { value: 0, label: 'No', color: 'transparent' },
    { value: 1, label: 'Yes', color: 'green' },
];

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

    const { width: pageWidth, height: pageHeight } = useWindowDimensions();
    const theme = useTheme();
    const { t } = useTranslation('mappingSession');

    const [mode, setMode] = useState<'mapping' | 'selection'>('mapping');
    const [selectedCellsByTile, setSelectedCellsByTile] = useState<Record<string, number[]>>({});
    const [tileSlotSize, setTileSlotSize] = useState({ width: 0, height: 0 });

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
        return DEFAULT_OPTIONS;
    }, [projectCustomOptions]);

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

    // Group per-cell tasks by tile-level id (taskId_real). Multiple per-cell
    // tasks share one tile; each carries the cell's referenceAnswer at its
    // taskPartitionIndex.
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

    // Seed: one array per tile, length = cellsPerTile, filled with default.
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

    // When the scenario is locked (correct / answers-shown), force-derive the
    // effective mode to 'mapping' so the overlay and controls disappear —
    // without writing state from an effect.
    const effectiveSelectionMode = mode === 'selection' && !disabled;

    const handleEnterSelectionMode = useCallback(() => {
        setMode('selection');
    }, []);

    const handleExitSelectionMode = useCallback(() => {
        setMode('mapping');
        setSelectedCellsByTile({});
    }, []);

    // Applies the chosen option's value to every selected cell (across tiles),
    // then clears the selection so the next batch can be selected fresh.
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

    const tileWidth = useMemo(() => {
        const availWidth = tileSlotSize.width || (pageWidth - 24);
        const availHeight = tileSlotSize.height || (pageHeight * 0.6);
        return Math.max(120, Math.min(availWidth, availHeight));
    }, [tileSlotSize, pageWidth, pageHeight]);

    return (
        <View style={styles.container}>
            {!disabled && (
                <InlineListView style={styles.controls} spacing="sm">
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
            )}
            <View
                style={styles.tileSlot}
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
            </View>
            {effectiveSelectionMode && (
                <View style={styles.optionsBarContainer} pointerEvents="box-none">
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
        </View>
    );
}

export default LocateTutorialSession;
