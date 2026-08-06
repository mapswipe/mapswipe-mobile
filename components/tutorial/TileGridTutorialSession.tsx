import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    compareNumber,
    isNotDefined,
    listToGroupList,
    mapToList,
} from '@togglecorp/fujs';

import { TutorialSessionProps } from '@/components/tutorial/types';
import Box from '@/components/ui/Box';
import HideTileSelectionButton from '@/components/ui/HideTileSelectionButton';
import Positioned from '@/components/ui/Positioned';
import Row from '@/components/ui/Row';
import ImageTile from '@/components/ui/tile/ImageTile';
import { TILE_ANSWER_OPTIONS } from '@/constants/answers';
import useAnswerColors from '@/hooks/useAnswerColors';
import useFittedTileWidth from '@/hooks/useFittedTileWidth';
import useViewport from '@/hooks/useViewport';
import {
    getTutorialTaskKey,
    TileTutorialTask,
} from '@/utils/tutorial';
import {
    PROJECT_TYPE_COMPLETENESS,
    Results,
} from '@/utils/types';

// Array order is the tap cycle.
const OPTIONS = [...TILE_ANSWER_OPTIONS];

// A 4pt gutter each side of the grid.
const TILE_RESERVE_INLINE = 8;

const MIN_TILE_WIDTH = 60;

// Fallback before onLayout: a 12pt gutter each side.
const FALLBACK_INLINE_CHROME = 24;

const FALLBACK_BLOCK_FRACTION = 0.6;

// Mirrors the inset HideTileSelectionButton's own container applies when it sits in flow.
const HIDE_BUTTON_INSET_BLOCK = 20;
const HIDE_BUTTON_INSET_INLINE = 14;

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

    const { width: pageWidth, height: pageHeight } = useViewport();
    const [hideTilePressValue, setHideTilePressValue] = useState(false);
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

    const tileWidth = useFittedTileWidth({
        availableInline: gridSize.width,
        availableBlock: gridSize.height,
        fallbackInline: pageWidth - FALLBACK_INLINE_CHROME,
        fallbackBlock: pageHeight * FALLBACK_BLOCK_FRACTION,
        reserveInline: TILE_RESERVE_INLINE,
        columns: numCols,
        rows: numRows,
        minSize: MIN_TILE_WIDTH,
    });

    const answerColors = useAnswerColors(OPTIONS);

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
        <Box
            flex={1}
            minHeight={0}
        >
            <Box
                flex={1}
                minHeight={0}
                align="center"
                justify="center"
                clip
                onLayout={(event) => setGridSize(event.nativeEvent.layout)}
            >
                <Row
                    spacing="none"
                    align="stretch"
                >
                    {groupedColumns.map((column) => (
                        <Box key={column.taskX}>
                            {column.rows.map((task) => {
                                const taskKey = getTutorialTaskKey(task);
                                const result = results[taskKey];
                                const answer = typeof result === 'number'
                                    ? answerColors[result]
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
                                        tintColor={
                                            hideTilePressValue ? undefined : answer?.tintColor
                                        }
                                        onPress={handleTilePress}
                                    />
                                );
                            })}
                        </Box>
                    ))}
                </Row>
            </Box>
            <Positioned
                anchor="bottomEnd"
                offsetBlock={HIDE_BUTTON_INSET_BLOCK}
                offsetInline={HIDE_BUTTON_INSET_INLINE}
            >
                <HideTileSelectionButton
                    handleHideTileSelectionPressIn={handleHideTilePressIn}
                    handleHideTileSelectionPressOut={handleHideTilePressOut}
                    // Positioned already insets it; the button's own padding would double up.
                    withoutContainer
                />
            </Positioned>
        </Box>
    );
}

export default TileGridTutorialSession;
