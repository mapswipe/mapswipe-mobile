import { type ThemeColorKey } from '@/constants/theme';

interface BuiltInAnswerFields {
    source: 'builtin';
    value: number;
    labelKey: string;
    defaultLabel: string;
    colorToken: ThemeColorKey;
    iconName: string | undefined;
    tintsTile: boolean;
}

export const ANSWER_OPTIONS = {
    no: {
        source: 'builtin',
        value: 0,
        labelKey: 'mappingSession:answerNo',
        defaultLabel: 'No',
        // Untinted tile, so this colour only reaches the option chip dot and the summary swatch.
        colorToken: 'textMuted',
        iconName: undefined,
        tintsTile: false,
    },
    yes: {
        source: 'builtin',
        value: 1,
        labelKey: 'mappingSession:answerYes',
        defaultLabel: 'Yes',
        colorToken: 'mapSelection',
        iconName: 'checkmark-outline',
        tintsTile: true,
    },
    maybe: {
        source: 'builtin',
        value: 2,
        labelKey: 'mappingSession:answerMaybe',
        defaultLabel: 'Maybe',
        colorToken: 'warning',
        iconName: 'question-mark',
        tintsTile: true,
    },
    badImagery: {
        source: 'builtin',
        value: 3,
        labelKey: 'mappingSession:answerBadImagery',
        defaultLabel: 'Bad Imagery',
        colorToken: 'mapRejected',
        iconName: 'ban-outline',
        tintsTile: true,
    },
} as const satisfies Record<string, BuiltInAnswerFields>;

export type AnswerType = keyof typeof ANSWER_OPTIONS;

export type BuiltInAnswerOption = (typeof ANSWER_OPTIONS)[AnswerType];

/** Subset of Icon's IconName, which a token module cannot import. */
export type AnswerIconName = NonNullable<BuiltInAnswerOption['iconName']>;

/** An answer from a project's Firebase customOptions: author data, not tokens. */
export interface BackendAnswerOption {
    source: 'backend';
    value: number;
    label: string;
    color: string;
    iconName: string;
}

/** `source` keeps token colours and raw backend colours apart at every consumer. */
export type AnswerOption = BuiltInAnswerOption | BackendAnswerOption;

/** Tap cycle for FIND, COMPLETENESS and COMPARE tiles. Array order is the cycle order. */
export const TILE_ANSWER_OPTIONS = [
    ANSWER_OPTIONS.no,
    ANSWER_OPTIONS.yes,
    ANSWER_OPTIONS.maybe,
    ANSWER_OPTIONS.badImagery,
] as const;

/** LOCATE_FEATURES fallback, for projects that ship no customOptions. */
export const LOCATE_DEFAULT_ANSWER_OPTIONS = [
    ANSWER_OPTIONS.no,
    ANSWER_OPTIONS.yes,
] as const;
