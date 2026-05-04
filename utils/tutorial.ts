import { isNotDefined } from '@togglecorp/fujs';
import { decode } from 'base-64';
import { inflate } from 'pako';

import {
    FbCompareTutorialTask,
    FbCompletenessTutorialTask,
    FbFindTutorialTask,
    FbStreetTutorialTask,
    FbTileMapServiceTutorialTask,
    FbValidateImageTutorialTask,
    FbValidateTutorialTask,
    PROJECT_TYPE_STREET,
    PROJECT_TYPE_VALIDATE_IMAGE,
    Results,
} from './types';

export const TUTORIAL_MAX_ATTEMPTS = 3;

export type TileTutorialTask = FbTileMapServiceTutorialTask
    & Partial<FbFindTutorialTask & FbCompletenessTutorialTask & FbCompareTutorialTask>;

export type AnyTutorialTask =
    | TileTutorialTask
    | FbValidateTutorialTask
    | FbValidateImageTutorialTask
    | FbStreetTutorialTask;

export function decompressTasks<T>(value: string | T[] | undefined | null): T[] {
    if (isNotDefined(value)) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    if (typeof value !== 'string') {
        return [];
    }

    const decodedStr = decode(value);
    const charList = decodedStr.split('').map((c) => c.charCodeAt(0));
    const binary = new Uint8Array(charList);
    const decompressed = inflate(binary, { to: 'string' });
    return JSON.parse(decompressed) as T[];
}

function getScreenIndex(task: AnyTutorialTask): number | undefined {
    if ('properties' in task && task.properties
        && typeof task.properties.screen === 'number') {
        return task.properties.screen;
    }
    if ('screen' in task && typeof task.screen === 'number') {
        return task.screen;
    }
    return undefined;
}

export function groupTasksByScreen<T extends AnyTutorialTask>(
    tasks: T[] | undefined,
): Record<number, T[]> {
    if (isNotDefined(tasks)) {
        return {};
    }
    return tasks.reduce<Record<number, T[]>>((acc, task) => {
        const screen = getScreenIndex(task);
        if (isNotDefined(screen)) {
            return acc;
        }
        if (!acc[screen]) {
            acc[screen] = [];
        }
        acc[screen].push(task);
        return acc;
    }, {});
}

function getReferenceForTask(task: AnyTutorialTask): number | undefined {
    if ('properties' in task && task.properties
        && typeof task.properties.reference === 'number') {
        return task.properties.reference;
    }
    if ('referenceAnswer' in task && typeof task.referenceAnswer === 'number') {
        return task.referenceAnswer;
    }
    return undefined;
}

export function getReferenceResults(tasks: AnyTutorialTask[]): Results {
    const result: Results = {};
    tasks.forEach((task) => {
        const reference = getReferenceForTask(task);
        if (reference !== undefined) {
            result[task.taskId] = reference;
        }
    });
    return result;
}

export function isScenarioCorrect(
    projectType: number,
    tasks: AnyTutorialTask[],
    results: Results,
): boolean {
    if (projectType === PROJECT_TYPE_VALIDATE_IMAGE || projectType === PROJECT_TYPE_STREET) {
        return true;
    }
    if (tasks.length === 0) {
        return true;
    }
    return tasks.every((task) => {
        const reference = getReferenceForTask(task);
        if (isNotDefined(reference)) {
            return true;
        }
        return results[task.taskId] === reference;
    });
}
