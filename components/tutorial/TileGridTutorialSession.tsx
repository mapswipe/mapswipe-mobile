import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import {
    compareNumber,
    isNotDefined,
    listToGroupList,
    listToMap,
    mapToList,
} from '@togglecorp/fujs';

import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import ImageTile from '@/components/ImageTile';
import { TutorialSessionProps } from '@/components/tutorial/types';
import {
    getTutorialTaskKey,
    TileTutorialTask,
} from '@/utils/tutorial';
import {
    PROJECT_TYPE_COMPLETENESS,
    ResultOption,
    Results,
} from '@/utils/types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 0,
    },
    gridArea: {
        flex: 1,
        minHeight: 0,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    column: {},
    row: {
        flexDirection: 'row',
    },
    // Anchor the hide button to the bottom-right overlay of the grid area
    // instead of letting it float at the container bottom (which left it
    // misaligned below the vertically-centered grid).
    hideButton: {
        position: 'absolute',
        bottom: 20,
        right: 14,
    },
});

const OPTIONS: ResultOption[] = [
    { value: 0, label: 'No', color: 'transparent' },
    { value: 1, label: 'Yes', color: 'green' },
    { value: 2, label: 'Maybe', color: 'yellow' },
    { value: 3, label: 'Bad Imagery', color: 'red' },
];

const optionsByValue = listToMap(OPTIONS, ({ value }) => value);

function getNextValue(value: number | undefined) {
    if (isNotDefined(value)) {
        return OPTIONS[0].value;
    }
    const optionIndex = OPTIONS.findIndex(({ value: v }) => value === v);
    const nextIndex = optionIndex + 1;
    if (optionIndex === -1 || nextIndex >= OPTIONS.length) {
        return OPTIONS[0].value;
    }
    return OPTIONS[nextIndex].value;
}

function TileGridTutorialSession(props: TutorialSessionProps) {
    const {
        tutorial,
        tasks,
        results,
        onResultsChange,
        disabled,
    } = props;

    const { width: pageWidth, height: pageHeight } = useWindowDimensions();
    const [hideTilePressValue, setHideTilePressValue] = useState(false);
    // Measured size of the grid slot, so tiles fit the space actually available
    // (between the instruction banner and the Check Answer button) rather than a
    // fixed fraction of the window — which overflowed and overlapped them.
    const [gridSize, setGridSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (tasks.length === 0) {
            return;
        }
        onResultsChange((prev) => {
            const missing = tasks.filter((t) => !(getTutorialTaskKey(t) in prev));
            if (missing.length === 0) {
                return prev;
            }
            const next: Results = { ...prev };
            missing.forEach((task) => {
                next[getTutorialTaskKey(task)] = OPTIONS[0].value;
            });
            return next;
        });
    }, [tasks, onResultsChange]);

    const groupedColumns = useMemo(() => {
        // The backend generated wrong taskX/taskY for tutorials (a since-fixed
        // scramble bug), and tutorials published before that fix keep those wrong
        // values in Firebase. taskId_real (`z-x-y`) was always correct, so we
        // position tiles from it instead of the synthetic taskX/taskY.
        const getX = (t: TileTutorialTask) => Number(t.taskId_real.split('-')[1]);
        const getY = (t: TileTutorialTask) => Number(t.taskId_real.split('-')[2]);

        const tileTasks = tasks.filter((t): t is TileTutorialTask => (
            'taskId_real' in t && typeof t.taskId_real === 'string'
        )).sort((a, b) => (
            compareNumber(getX(a), getX(b)) || compareNumber(getY(a), getY(b))
        ));

        return mapToList(
            listToGroupList(tileTasks, getX),
            (rows, key) => ({
                x: Number(key),
                rows: [...rows].sort((a, b) => compareNumber(getY(a), getY(b))),
            }),
        );
    }, [tasks]);

    const numCols = groupedColumns.length || 1;
    const numRows = groupedColumns[0]?.rows.length || 1;

    const tileWidth = useMemo(() => {
        const availWidth = gridSize.width || (pageWidth - 24);
        const availHeight = gridSize.height || (pageHeight * 0.60);
        const horizontalBudget = (availWidth - 8) / numCols;
        const verticalBudget = availHeight / numRows;
        return Math.max(60, Math.min(horizontalBudget, verticalBudget));
    }, [gridSize, pageWidth, pageHeight, numCols, numRows]);

    const handleTilePress = useCallback((taskId: string) => {
        if (disabled) {
            return;
        }
        onResultsChange((prev) => {
            const prevValue = prev[taskId];
            return {
                ...prev,
                [taskId]: getNextValue(typeof prevValue === 'number' ? prevValue : undefined),
            };
        });
    }, [disabled, onResultsChange]);

    const handleHideTilePressIn = useCallback(() => {
        setHideTilePressValue(true);
    }, []);

    const handleHideTilePressOut = useCallback(() => {
        setHideTilePressValue(false);
    }, []);

    return (
        <View style={styles.container}>
            <View
                style={styles.gridArea}
                onLayout={(event) => setGridSize(event.nativeEvent.layout)}
            >
                <View style={styles.row}>
                    {groupedColumns.map((column) => (
                        <View key={column.x} style={styles.column}>
                            {column.rows.map((task) => {
                                const taskKey = getTutorialTaskKey(task);
                                const result = results[taskKey];
                                const selectedOption = typeof result === 'number'
                                    ? optionsByValue[result]
                                    : undefined;

                                if (!task.url) {
                                    return null;
                                }

                                return (
                                    <ImageTile
                                        key={taskKey}
                                        taskId={taskKey}
                                        url={task.url}
                                        urlB={
                                            tutorial.projectType === PROJECT_TYPE_COMPLETENESS
                                                ? task.urlB
                                                : undefined
                                        }
                                        width={tileWidth}
                                        tintColor={hideTilePressValue ? 'transparent' : selectedOption?.color}
                                        onPress={handleTilePress}
                                    />
                                );
                            })}
                        </View>
                    ))}
                </View>
            </View>
            <HideTileSelectionButton
                handleHideTileSelectionPressIn={handleHideTilePressIn}
                handleHideTileSelectionPressOut={handleHideTilePressOut}
                isPressed={hideTilePressValue}
                containerStyle={styles.hideButton}
            />
        </View>
    );
}

export default TileGridTutorialSession;
