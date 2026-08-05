import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { isNotDefined } from '@togglecorp/fujs';

import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import ImageTile from '@/components/ImageTile';
import { TutorialSessionProps } from '@/components/tutorial/types';
import Box from '@/components/ui/Box';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { TILE_ANSWER_OPTIONS } from '@/constants/answers';
import useAnswerColors from '@/hooks/useAnswerColors';
import useFittedTileWidth from '@/hooks/useFittedTileWidth';
import useViewport from '@/hooks/useViewport';
import { getTutorialTaskKey } from '@/utils/tutorial';
import { Results } from '@/utils/types';

/**
 * The tap cycle: 0 No, 1 Yes, 2 Maybe, 3 Bad Imagery, in that order. These are the BUILT-IN
 * answers, the same list CompareMappingSession maps with, so their colours are theme tokens
 * resolved through useAnswerColors and never a project's customOptions. Spread out of the
 * readonly tuple so findIndex can take it.
 */
const OPTIONS = [...TILE_ANSWER_OPTIONS];

// Before and After are stacked, so the two of them share the slot's block axis.
const TILE_ROWS = 2;

/** A 12pt gutter on each side of the pair. */
const TILE_RESERVE_INLINE = 24;

const TILE_RESERVE_BLOCK = 64;

/** Floor the pair never shrinks past, however short the scenario page gets. */
const MIN_TILE_WIDTH = 80;

/**
 * Stand-in for the slot's block extent before onLayout reports one, as the window less the
 * scenario page's chrome (the feedback banner, the Check Answer button and their gaps).
 */
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
    // Measured size of the pair slot, so the before/after tiles fit the space available
    // rather than a fixed fraction of the window.
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
                {/* The Box above owns the slot and the measurement; this owns the rhythm
                    between pairs, which is a spacing rung and so not Box's to state. */}
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
