import { useMemo } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import Svg, {
    Path,
    Text,
} from 'react-native-svg';

import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = (_theme: AppTheme, { bottomPadding, position, visible }: {
    position: 'bottom' | 'top';
    visible: boolean;
    bottomPadding: number,
}) => StyleSheet.create({
    container: {
        opacity: visible ? 0.5 : 0,
        position: 'absolute',
        left: 10,
        bottom: position === 'bottom' ? bottomPadding : undefined,
        top: position === 'top' ? 20 : undefined,
    },
});

const getScaleBarPath = (
    meters: number,
    feet: number,
    tileWidthInMeters: number,
    referenceSize: number,
): string => {
    const top = 0;
    const mid = 16;
    const metersPx = (meters / tileWidthInMeters) * referenceSize;
    const feetPx = (feet / tileWidthInMeters) * referenceSize;
    const bottom = top + 2 * (mid - top);

    return [
        `M0 ${top}`,
        `L0 ${bottom}`,
        `M0 ${mid}`,
        `L${metersPx} ${mid}`,
        `L${metersPx} ${top}`,
        `M${metersPx} ${mid}`,
        `L${feetPx * 0.3048} ${mid}`,
        `L${feetPx * 0.3048} ${bottom}`,
    ].join(' ');
};

interface Props {
    latitude: number;
    position?: 'bottom' | 'top';
    referenceSize: number;
    visible?: boolean;
    zoomLevel: number;
    tileSize: number;
    bottomPadding?: number;
}

function ScaleBar(props: Props) {
    const {
        latitude,
        position = 'bottom',
        referenceSize,
        visible = true,
        zoomLevel,
        tileSize,
        bottomPadding = 20,
    } = props;

    const styles = useThemedStyles(createStyles, { bottomPadding, position, visible });

    const { meters, feet, tileWidthInMeters } = useMemo(() => {
        const tileWidth = (Math.cos(latitude * (Math.PI / 180)) * 2 * Math.PI * 6378137)
                / 2 ** zoomLevel;

        let m: number;
        let f: number;

        if (tileWidth < 200) {
            m = Math.trunc(tileWidth / 10 / 2) * 10;
            f = Math.round(m / 0.3048 / 100) * 100;
        } else {
            m = Math.trunc(tileWidth / 100 / 2) * 100;
            f = Math.round(m / 0.3048 / 100) * 100;
        }

        return { meters: m, feet: f, tileWidthInMeters: tileWidth };
    }, [latitude, zoomLevel]);

    const path = useMemo(
        () => getScaleBarPath(meters, feet, tileWidthInMeters, referenceSize),
        [meters, feet, tileWidthInMeters, referenceSize],
    );

    return (
        <View style={styles.container}>
            <Svg height={tileSize / 5} width={referenceSize}>
                <Path d={path} stroke="white" strokeWidth={1} />
                <Text
                    fill="white"
                    fontSize={13}
                    fontFamily="Helvetica, Arial"
                    x="3"
                    y="13"
                >
                    {`${meters}m`}
                </Text>
                <Text
                    fill="white"
                    fontSize={13}
                    fontFamily="Helvetica, Arial"
                    x="3"
                    y="30"
                >
                    {`${feet}ft`}
                </Text>
            </Svg>
        </View>
    );
}

export default ScaleBar;
