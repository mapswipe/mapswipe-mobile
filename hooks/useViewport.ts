import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export interface Viewport {
    width: number;
    height: number;
    isLandscape: boolean;
}

function useViewport(): Viewport {
    const { width, height } = useWindowDimensions();

    return useMemo(() => ({
        width,
        height,
        isLandscape: width > height,
    }), [width, height]);
}

export default useViewport;
