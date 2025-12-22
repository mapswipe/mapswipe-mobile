import { getAdditionalInlineCompensatedSpacingValue, getOpticallyCorrectedSpacingValue, getSpacingValue, paddingSpacings, SpacingMode, SpacingType } from "@/utils/styles";
import { isNotDefined, listToMap } from "@togglecorp/fujs";
import { useMemo } from "react";
import { ViewStyle } from "react-native";

interface Props {
    spacing?: SpacingType;
    offset?: number;
    modes?: SpacingMode[];
    withoutOpticalCorrection?: boolean;
    withAdditionalInlinePadding?: boolean;
}

function useSpacingToken(props: Props) {
    const {
        spacing = 'md',
        modes = paddingSpacings,
        offset = 0,
        withoutOpticalCorrection,
        withAdditionalInlinePadding,
    } = props;

    const style = useMemo<ViewStyle>(() => {
        if (isNotDefined(spacing)) {
            return {};
        }

        const spacingValue = getSpacingValue(spacing, offset);

        return listToMap(
            modes,
            (mode) => mode,
            (mode) => {
                const compensatedValue = getAdditionalInlineCompensatedSpacingValue(spacingValue, mode, !!withAdditionalInlinePadding);
                return withoutOpticalCorrection
                    ? compensatedValue
                    : getOpticallyCorrectedSpacingValue(compensatedValue, mode);
            }
        );
    }, [spacing, modes, offset, withoutOpticalCorrection, withAdditionalInlinePadding]);

    return style;
}

export default useSpacingToken;
