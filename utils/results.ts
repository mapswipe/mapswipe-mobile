import {
    compareNumber,
    isDefined,
} from '@togglecorp/fujs';

import {
    FbProject,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_LOCATE_FEATURES,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
    ResultOption,
    Results,
} from './types';

// Tile-based projects (FIND / COMPLETENESS / COMPARE) use this fixed option set.
// Keep in sync with the options defined in the corresponding session components.
const TILE_OPTIONS: ResultOption[] = [
    { value: 0, label: 'No', color: 'transparent' },
    { value: 1, label: 'Yes', color: 'green' },
    { value: 2, label: 'Maybe', color: 'yellow' },
    { value: 3, label: 'Bad Imagery', color: 'red' },
];

// Fallback for LOCATE_FEATURES projects without custom options.
const LOCATE_DEFAULT_OPTIONS: ResultOption[] = [
    { value: 0, label: 'No', color: 'transparent' },
    { value: 1, label: 'Yes', color: 'green' },
];

const fromCustomOptions = (
    customOptions: { value: number; title: string; iconColor: string }[],
): ResultOption[] => (
    customOptions.map((option) => ({
        value: option.value,
        label: option.title,
        color: option.iconColor,
    }))
);

/**
 * The answer options for a project, mapped to a common { value, label, color }
 * shape. Mirrors the per-type option logic in the session components so result
 * values can be labelled outside of those components (e.g. the session summary).
 */
export function getResultOptions(projectDetails: FbProject): ResultOption[] {
    switch (projectDetails.projectType) {
        case PROJECT_TYPE_FIND:
        case PROJECT_TYPE_COMPLETENESS:
        case PROJECT_TYPE_COMPARE:
            return TILE_OPTIONS;
        case PROJECT_TYPE_VALIDATE:
        case PROJECT_TYPE_VALIDATE_IMAGE:
            return fromCustomOptions(projectDetails.customOptions ?? []);
        case PROJECT_TYPE_LOCATE_FEATURES:
            return isDefined(projectDetails.customOptions)
                && projectDetails.customOptions.length > 0
                ? fromCustomOptions(projectDetails.customOptions)
                    .sort((a, b) => compareNumber(a.value, b.value))
                : LOCATE_DEFAULT_OPTIONS;
        default:
            return [];
    }
}

export interface AnswerCount {
    value: number;
    label: string;
    color: string;
    count: number;
}

/**
 * Counts how many times each option value occurs across the results. Tile
 * answers are a single number per task; LOCATE_FEATURES answers are an array of
 * per-cell values, which are flattened and counted per cell.
 */
export function getAnswerCounts(
    results: Results,
    options: ResultOption[],
): AnswerCount[] {
    const counts: Record<number, number> = {};

    Object.values(results).forEach((result) => {
        const values = Array.isArray(result) ? result : [result];
        values.forEach((value) => {
            if (typeof value === 'number') {
                counts[value] = (counts[value] ?? 0) + 1;
            }
        });
    });

    return options.map((option) => ({
        value: option.value,
        label: option.label,
        color: option.color,
        count: counts[option.value] ?? 0,
    }));
}
