import {
    useCallback,
    useEffect,
    useRef,
    useState,
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
import TutorialEndPage from './TutorialEndPage';
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
        minHeight: 0,
    },
    list: {
        flex: 1,
        minHeight: 0,
    },
    page: {
        flex: 1,
        minHeight: 0,
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
    // Horizontal FlatList items are sized to their content vertically, not to
    // the list's visible height — so a tall scenario (e.g. the map) makes the
    // page grow past the screen and pushes the buttons off the bottom. Measure
    // the list and give every page an explicit height to bound them.
    const [listHeight, setListHeight] = useState(0);

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
                <TutorialOutroPage tutorial={item.tutorial} />
            );
        } else if (item.type === 'end') {
            content = (
                <TutorialEndPage
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
            <View style={[styles.page, { width: pageWidth, height: listHeight || undefined }]}>
                {content}
            </View>
        );
    }, [
        pageWidth,
        listHeight,
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
                onLayout={(event) => setListHeight(event.nativeEvent.layout.height)}
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
                extraData={`${currentIndex}-${scrollEnabled}-${listHeight}`}
            />
            <View style={styles.footer}>
                <StageIndicator total={stages.length} currentIndex={currentIndex} />
            </View>
        </View>
    );
}

export default TutorialPager;
