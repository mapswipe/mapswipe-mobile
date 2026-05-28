import {
    useCallback,
    useEffect,
    useRef,
} from 'react';
import {
    FlatList,
    ListRenderItem,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

import {
    SPACING_2XS,
    SPACING_3XS,
    SPACING_XS,
} from '@/constants/dimensions';
import {
    FbObjCustomOption,
    FbTutorial,
    Results,
} from '@/utils/types';

import StageIndicator from './StageIndicator';
import TutorialInformationPage from './TutorialInformationPage';
import TutorialIntroPage from './TutorialIntroPage';
import TutorialOutroPage from './TutorialOutroPage';
import TutorialScenarioPage from './TutorialScenarioPage';
import {
    ScenarioState,
    TutorialStage,
} from './types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    list: {
        flex: 1,
    },
    page: {
        flex: 1,
    },
    footer: {
        paddingHorizontal: SPACING_XS,
        paddingBottom: SPACING_2XS,
        paddingTop: SPACING_3XS,
    },
});

interface Props {
    projectId: string;
    tutorial: FbTutorial;
    stages: TutorialStage[];
    currentIndex: number;
    onIndexChange: (index: number) => void;
    canAdvanceFrom: (index: number) => boolean;
    scenarioResults: Record<number, Results>;
    onScenarioResultsChange: (
        screenIndex: number,
        next: Results | ((prev: Results) => Results),
    ) => void;
    scenarioStates: Record<number, ScenarioState>;
    attemptCounts: Record<number, number>;
    onScenarioSubmit: (screenIndex: number, correct: boolean) => void;
    onScenarioShowAnswers: (screenIndex: number) => void;
    projectCustomOptions?: FbObjCustomOption[];
}

function TutorialPager(props: Props) {
    const {
        projectId,
        tutorial,
        stages,
        currentIndex,
        onIndexChange,
        canAdvanceFrom,
        scenarioResults,
        onScenarioResultsChange,
        scenarioStates,
        attemptCounts,
        onScenarioSubmit,
        onScenarioShowAnswers,
        projectCustomOptions,
    } = props;

    const { width: pageWidth } = useWindowDimensions();
    const listRef = useRef<FlatList<TutorialStage>>(null);

    useEffect(() => {
        listRef.current?.scrollToIndex({ index: currentIndex, animated: true });
    }, [currentIndex]);

    const handleMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const newIndex = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
        if (newIndex !== currentIndex) {
            onIndexChange(newIndex);
        }
    }, [pageWidth, currentIndex, onIndexChange]);

    const renderStage = useCallback<ListRenderItem<TutorialStage>>(({ item }) => {
        let content: React.ReactNode = null;

        if (item.type === 'intro') {
            content = (
                <TutorialIntroPage
                    tutorial={item.tutorial}
                    projectCustomOptions={projectCustomOptions}
                />
            );
        } else if (item.type === 'info') {
            content = <TutorialInformationPage page={item.page} />;
        } else if (item.type === 'outro') {
            content = (
                <TutorialOutroPage
                    tutorial={item.tutorial}
                    projectId={projectId}
                />
            );
        } else if (item.type === 'scenario') {
            const { screenIndex } = item;
            const state = scenarioStates[screenIndex] ?? 'unanswered';
            const attempts = attemptCounts[screenIndex] ?? 0;
            const results = scenarioResults[screenIndex] ?? {};

            content = (
                <TutorialScenarioPage
                    tutorial={tutorial}
                    screen={item.screen}
                    screenIndex={screenIndex}
                    tasks={item.tasks}
                    results={results}
                    onScenarioResultsChange={onScenarioResultsChange}
                    state={state}
                    attempts={attempts}
                    onScenarioSubmit={onScenarioSubmit}
                    onScenarioShowAnswers={onScenarioShowAnswers}
                    projectCustomOptions={projectCustomOptions}
                />
            );
        }

        return (
            <View style={[styles.page, { width: pageWidth }]}>
                {content}
            </View>
        );
    }, [
        pageWidth,
        projectId,
        tutorial,
        scenarioStates,
        attemptCounts,
        scenarioResults,
        onScenarioResultsChange,
        onScenarioSubmit,
        onScenarioShowAnswers,
        projectCustomOptions,
    ]);

    const scrollEnabled = canAdvanceFrom(currentIndex);

    return (
        <View style={styles.container}>
            <FlatList
                ref={listRef}
                style={styles.list}
                data={stages}
                keyExtractor={(_, i) => `stage-${i}`}
                renderItem={renderStage}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={scrollEnabled}
                onMomentumScrollEnd={handleMomentumEnd}
                getItemLayout={(_, index) => ({
                    length: pageWidth,
                    offset: pageWidth * index,
                    index,
                })}
                initialScrollIndex={currentIndex}
                extraData={`${currentIndex}-${scrollEnabled}`}
            />
            <View style={styles.footer}>
                <StageIndicator total={stages.length} currentIndex={currentIndex} />
            </View>
        </View>
    );
}

export default TutorialPager;
