import { AnyTutorialTask } from '@/utils/tutorial';
import {
    FbInformationPage,
    FbScreen,
    FbTutorial,
    Results,
} from '@/utils/types';

export type ScenarioState =
    | 'unanswered'
    | 'correct'
    | 'wrong'
    | 'skip-unlocked'
    | 'answers-shown';

export type TutorialStage =
    | { type: 'intro'; tutorial: FbTutorial }
    | { type: 'info'; page: FbInformationPage }
    | {
        type: 'scenario';
        screen: FbScreen;
        screenIndex: number;
        tasks: AnyTutorialTask[];
    }
    | { type: 'outro'; tutorial: FbTutorial };

export interface TutorialSessionProps {
    tutorial: FbTutorial;
    tasks: AnyTutorialTask[];
    results: Results;
    onResultsChange: (next: Results | ((prev: Results) => Results)) => void;
    disabled: boolean;
}
