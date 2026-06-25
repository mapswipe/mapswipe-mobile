import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';
import {
    isNotDefined,
    listToMap,
} from '@togglecorp/fujs';

import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import ImageTile from '@/components/ImageTile';
import Text from '@/components/Text';
import { TutorialSessionProps } from '@/components/tutorial/types';
import { SPACING_3XS } from '@/constants/dimensions';
import {
    ResultOption,
    Results,
} from '@/utils/types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 0,
    },
    pairsArea: {
        flex: 1,
        minHeight: 0,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING_3XS,
        overflow: 'hidden',
    },
    pair: {
        alignItems: 'center',
        gap: SPACING_3XS,
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

function CompareTutorialSession(props: TutorialSessionProps) {
    const {
        tasks,
        results,
        onResultsChange,
        disabled,
    } = props;

    const { t } = useTranslation('tutorialScreen');
    const { width: pageWidth, height: pageHeight } = useWindowDimensions();
    const [hideTilePressValue, setHideTilePressValue] = useState(false);
    // Measured size of the pair slot, so the before/after tiles fit the space
    // available rather than a fixed fraction of the window.
    const [pairsSize, setPairsSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (tasks.length === 0) {
            return;
        }
        onResultsChange((prev) => {
            const missing = tasks.filter((task) => !(task.taskId in prev));
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

    const tileWidth = useMemo(() => {
        const availWidth = pairsSize.width || pageWidth;
        const availHeight = pairsSize.height || (pageHeight - 300);
        // Two tiles stacked, plus the Before/After labels and gaps between them.
        const verticalBudget = (availHeight - 64) / 2;
        return Math.max(80, Math.min(availWidth - 24, verticalBudget));
    }, [pairsSize, pageWidth, pageHeight]);

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
                style={styles.pairsArea}
                onLayout={(event) => setPairsSize(event.nativeEvent.layout)}
            >
                {tasks.map((task) => {
                    if (!('url' in task) || !('urlB' in task) || !task.url || !task.urlB) {
                        return null;
                    }
                    const result = results[task.taskId];
                    const selectedOption = typeof result === 'number'
                        ? optionsByValue[result]
                        : undefined;

                    return (
                        <View key={task.taskId} style={styles.pair}>
                            <Text colorVariant="brand">{t('compareBefore')}</Text>
                            <ImageTile
                                taskId={task.taskId}
                                url={task.url}
                                urlB={undefined}
                                width={tileWidth}
                                tintColor={hideTilePressValue ? 'transparent' : selectedOption?.color}
                                onPress={handleTilePress}
                            />
                            <Text colorVariant="brand">{t('compareAfter')}</Text>
                            <ImageTile
                                taskId={task.taskId}
                                url={task.urlB}
                                urlB={undefined}
                                width={tileWidth}
                                tintColor={hideTilePressValue ? 'transparent' : selectedOption?.color}
                                onPress={handleTilePress}
                            />
                        </View>
                    );
                })}
            </View>
            <HideTileSelectionButton
                handleHideTileSelectionPressIn={handleHideTilePressIn}
                handleHideTileSelectionPressOut={handleHideTilePressOut}
                isPressed={hideTilePressValue}
            />
        </View>
    );
}

export default CompareTutorialSession;
