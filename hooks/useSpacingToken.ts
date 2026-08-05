import { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import { listToMap } from '@togglecorp/fujs';

import {
    getSpacingValue,
    paddingSpacings,
    SpacingMode,
    SpacingType,
} from '@/utils/styles';

interface Props {
    spacing?: SpacingType;
    offset?: number;
    modes?: SpacingMode[];
}

function useSpacingToken(props: Props) {
    const {
        spacing = 'md',
        modes = paddingSpacings,
        offset = 0,
    } = props;

    const style = useMemo<ViewStyle>(() => {
        const spacingValue = getSpacingValue(spacing, offset);

        return listToMap(
            modes,
            (mode) => mode,
            () => spacingValue,
        );
    }, [spacing, modes, offset]);

    return style;
}

export default useSpacingToken;
