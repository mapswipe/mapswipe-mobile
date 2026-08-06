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

// Keep in sync with the options in the tile session components (FIND / COMPLETENESS / COMPARE).
const TILE_OPTIONS: ResultOption[] = [
    { value: 0, label: 'No', color: 'transparent' },
    { value: 1, label: 'Yes', color: 'green' },
    { value: 2, label: 'Maybe', color: 'yellow' },
    { value: 3, label: 'Bad Imagery', color: 'red' },
];

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
