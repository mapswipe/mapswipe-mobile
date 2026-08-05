import { useMemo } from 'react';
import { listToMap } from '@togglecorp/fujs';

import {
    type AnswerIconName,
    type BuiltInAnswerOption,
} from '@/constants/answers';
import useTheme from '@/hooks/useTheme';

export interface AnswerColors {
    value: number;
    tintColor: string | undefined;
    /** Only read when `iconName` is defined. */
    badgeColor: string;
    iconName: AnswerIconName | undefined;
}

function useAnswerColors(
    options: readonly BuiltInAnswerOption[],
): Record<number, AnswerColors> {
    const theme = useTheme();

    return useMemo(() => listToMap(
        options.map((option) => ({
            value: option.value,
            tintColor: option.tintsTile ? theme[option.colorToken] : undefined,
            badgeColor: theme[option.colorToken],
            iconName: option.iconName,
        })),
        ({ value }) => value,
    ), [options, theme]);
}

export default useAnswerColors;
