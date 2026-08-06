import {
    type ReactNode,
    useCallback,
} from 'react';

import Pager from '@/components/ui/Pager';
import Stack from '@/components/ui/Stack';
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

    const selectStageKey = useCallback(
        (_: TutorialStage, index: number) => `stage-${index}`,
        [],
    );

    const renderStage = useCallback((item: TutorialStage): ReactNode => {
        if (item.type === 'intro') {
            return (
                <TutorialIntroPage
                    tutorial={item.tutorial}
                    projectCustomOptions={projectCustomOptions}
                />
            );
        }

        if (item.type === 'info') {
            return <TutorialInformationPage page={item.page} />;
        }

        if (item.type === 'outro') {
            return (
                <TutorialOutroPage tutorial={item.tutorial} />
            );
        }

        if (item.type === 'end') {
            return (
                <TutorialEndPage
                    tutorial={item.tutorial}
                    projectId={projectId}
                />
            );
        }

        if (item.type === 'scenario') {
            const { screenIndex } = item;

            return (
                <TutorialScenarioPage
                    tutorial={tutorial}
                    screen={item.screen}
                    screenIndex={screenIndex}
                    tasks={item.tasks}
                    results={scenarioResults[screenIndex] ?? {}}
                    onScenarioResultsChange={onScenarioResultsChange}
                    state={scenarioStates[screenIndex] ?? 'unanswered'}
                    attempts={attemptCounts[screenIndex] ?? 0}
                    onScenarioSubmit={onScenarioSubmit}
                    onScenarioShowAnswers={onScenarioShowAnswers}
                    projectCustomOptions={projectCustomOptions}
                />
            );
        }

        return null;
    }, [
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

    return (
        <Stack spacing="none" grow="slot">
            <Pager
                sizeVariant="page"
                data={stages}
                keyExtractor={selectStageKey}
                renderPage={renderStage}
                index={currentIndex}
                onIndexChange={onIndexChange}
                withPagingLocked={!canAdvanceFrom(currentIndex)}
            />
            <Stack spacing="none" padding="2xs">
                <StageIndicator total={stages.length} currentIndex={currentIndex} />
            </Stack>
        </Stack>
    );
}

export default TutorialPager;
