import {
    BoxShadowValue,
    ColorValue,
    ViewStyle,
} from 'react-native';

type ElevationStyle = {
    boxShadow: readonly BoxShadowValue[];
};

// Geometry only, no colour. RN 0.85 paints a colourless boxShadow entry opaque black
// (BackgroundStyleApplicator.kt), so read these through getElevationStyle and pass the
// theme's shadow colour.
const noShadow: ElevationStyle = {
    boxShadow: [],
};

// Reproduces the project card shadow at app/(auth)/(home)/projects.tsx:103-109.
const raisedShadow: ElevationStyle = {
    boxShadow: [{
        offsetX: 0,
        offsetY: 2,
        blurRadius: 8,
        spreadDistance: 0,
    }],
};

const overlayShadow: ElevationStyle = {
    boxShadow: [{
        offsetX: 0,
        offsetY: 4,
        blurRadius: 16,
        spreadDistance: 0,
    }],
};

// Android 'elevation' is deliberately absent. boxShadow renders on both platforms under Fabric,
// so elevation would only add a second, doubled shadow on API 28 and above.
export const ELEVATION = {
    none: noShadow,
    raised: raisedShadow,
    overlay: overlayShadow,
} satisfies Record<string, ViewStyle>;

export type ElevationType = keyof typeof ELEVATION;

export function getElevationStyle(
    elevationType: ElevationType,
    shadowColor: ColorValue,
): ViewStyle {
    return {
        boxShadow: ELEVATION[elevationType].boxShadow.map((shadow) => ({
            ...shadow,
            color: shadowColor,
        })),
    };
}
