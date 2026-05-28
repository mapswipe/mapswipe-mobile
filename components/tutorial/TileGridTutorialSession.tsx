import {
    useCallback,
    useEffect,
    useMemo,
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

import ImageTile from '@/components/ImageTile';
import { TutorialSessionProps } from '@/components/tutorial/types';
import { TileTutorialTask } from '@/utils/tutorial';
import {
    PROJECT_TYPE_COMPLETENESS,
    ResultOption,
    Results,
} from '@/utils/types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    column: {},
    row: {
        flexDirection: 'row',
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

    useEffect(() => {
        if (tasks.length === 0) {
            return;
        }
        onResultsChange((prev) => {
            const missing = tasks.filter((t) => !(t.taskId in prev));
            if (missing.length === 0) {
                return prev;
            }
            const next: Results = { ...prev };
            missing.forEach((task) => {
                next[task.taskId] = OPTIONS[0].value;
            });
            return next;
        });
    }, [tasks, onResultsChange]);

    const groupedColumns = useMemo(() => {
        const tileTasks = tasks.filter((t): t is TileTutorialTask => (
            'taskX' in t && 'taskY' in t
            && typeof t.taskX === 'number' && typeof t.taskY === 'number'
        )).sort((a, b) => (
            compareNumber(a.taskX, b.taskX) || compareNumber(a.taskY, b.taskY)
        ));

        return mapToList(
            listToGroupList(tileTasks, (t) => t.taskX),
            (rows, key) => ({
                taskX: key,
                rows: [...rows].sort((a, b) => compareNumber(a.taskY, b.taskY)),
            }),
        );
    }, [tasks]);

    const numCols = groupedColumns.length || 1;
    const numRows = groupedColumns[0]?.rows.length || 1;

    const tileWidth = useMemo(() => {
        const horizontalBudget = (pageWidth - 24) / numCols;
        const verticalBudget = (pageHeight * 0.65) / numRows;
        return Math.max(80, Math.min(horizontalBudget, verticalBudget));
    }, [pageWidth, pageHeight, numCols, numRows]);

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

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {groupedColumns.map((column) => (
                    <View key={column.taskX} style={styles.column}>
                        {column.rows.map((task) => {
                            const result = results[task.taskId];
                            const selectedOption = typeof result === 'number'
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
                                        tutorial.projectType === PROJECT_TYPE_COMPLETENESS
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
                ))}
            </View>
        </View>
    );
}

export default TileGridTutorialSession;
