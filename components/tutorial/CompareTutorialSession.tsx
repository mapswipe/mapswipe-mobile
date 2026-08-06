import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { isNotDefined } from '@togglecorp/fujs';

import { TutorialSessionProps } from '@/components/tutorial/types';
import Box from '@/components/ui/Box';
import HideTileSelectionButton from '@/components/ui/HideTileSelectionButton';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import ImageTile from '@/components/ui/tile/ImageTile';
import { TILE_ANSWER_OPTIONS } from '@/constants/answers';
import useAnswerColors from '@/hooks/useAnswerColors';
import useFittedTileWidth from '@/hooks/useFittedTileWidth';
import useViewport from '@/hooks/useViewport';
import { getTutorialTaskKey } from '@/utils/tutorial';
import { Results } from '@/utils/types';

// Array order is the tap cycle; spread so findIndex can take the readonly tuple.
const OPTIONS = [...TILE_ANSWER_OPTIONS];

// Before and After stack, so the pair spans two rows.
const TILE_ROWS = 2;

// A 12pt gutter on each side of the pair.
const TILE_RESERVE_INLINE = 24;

const TILE_RESERVE_BLOCK = 64;

const MIN_TILE_WIDTH = 80;

// Fallback before onLayout: the window less the scenario page's own bars.
const FALLBACK_BLOCK_CHROME = 300;

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

function CompareTutorialSession(props: TutorialSessionProps) {
    const {
        tasks,
        results,
        onResultsChange,
        disabled,
    } = props;

    const { t } = useTranslation('tutorialScreen');
    const { width: pageWidth, height: pageHeight } = useViewport();
    const [hideTilePressValue, setHideTilePressValue] = useState(false);
    const [pairsSize, setPairsSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (tasks.length === 0) {
            return;
        }
        onResultsChange((prev) => {
            const missing = tasks.filter((task) => !(getTutorialTaskKey(task) in prev));
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

    const tileWidth = useFittedTileWidth({
        availableInline: pairsSize.width,
        availableBlock: pairsSize.height,
        fallbackInline: pageWidth,
        fallbackBlock: pageHeight - FALLBACK_BLOCK_CHROME,
        reserveInline: TILE_RESERVE_INLINE,
        reserveBlock: TILE_RESERVE_BLOCK,
        rows: TILE_ROWS,
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
                onLayout={(event) => setPairsSize(event.nativeEvent.layout)}
            >
                <Stack
                    spacing="3xs"
                    align="center"
                >
                    {tasks.map((task) => {
                        if (!('url' in task) || !('urlB' in task) || !task.url || !task.urlB) {
                            return null;
                        }
                        const taskKey = getTutorialTaskKey(task);
                        const result = results[taskKey];
                        const answer = typeof result === 'number'
                            ? answerColors[result]
                            : undefined;
                        const tintColor = hideTilePressValue ? undefined : answer?.tintColor;

                        return (
                            <Stack
                                key={taskKey}
                                spacing="3xs"
                                align="center"
                            >
                                <Text colorVariant="onBrand">{t('compareBefore')}</Text>
                                <ImageTile
                                    taskId={taskKey}
                                    url={task.url}
                                    urlB={undefined}
                                    width={tileWidth}
                                    tintColor={tintColor}
                                    onPress={handleTilePress}
                                />
                                <Text colorVariant="onBrand">{t('compareAfter')}</Text>
                                <ImageTile
                                    taskId={taskKey}
                                    url={task.urlB}
                                    urlB={undefined}
                                    width={tileWidth}
                                    tintColor={tintColor}
                                    onPress={handleTilePress}
                                />
                            </Stack>
                        );
                    })}
                </Stack>
            </Box>
            <HideTileSelectionButton
                handleHideTileSelectionPressIn={handleHideTilePressIn}
                handleHideTileSelectionPressOut={handleHideTilePressOut}
            />
        </Box>
    );
}

export default CompareTutorialSession;
