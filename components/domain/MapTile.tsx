import {
    useId,
    useMemo,
} from 'react';
import {
    type StyleProp,
    StyleSheet,
    View,
    type ViewStyle,
} from 'react-native';
import {
    Camera,
    LineLayer,
    MapView,
    RasterLayer,
    RasterSource,
    ShapeSource,
} from '@maplibre/maplibre-react-native';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    getBbox,
    getCenterFromBBox,
    getOptimalZoomLevel,
    standardizeQuadKey,
} from '@/utils/geo';
import { FbObjRasterTileServer } from '@/utils/types';

interface Props {
    geoJson: GeoJSON.GeoJSON;
    tileServer: FbObjRasterTileServer;
    hideLines?: boolean;
    // The container sizes to content, so a caller filling a flex slot must pass `{ flex: 1 }`.
    style?: StyleProp<ViewStyle>;
}

const createStyles = () => StyleSheet.create({
    container: {
        position: 'relative',
        borderRadius: 10,
        overflow: 'hidden',
    },
    mapView: {
        width: '100%',
        height: '100%',
    },
});

function MapTile(props: Props) {
    const {
        geoJson,
        tileServer,
        hideLines = false,
        style,
    } = props;

    const instanceId = useId();

    const theme = useTheme();
    const styles = useThemedStyles(createStyles);

    const bounds = useMemo(() => getBbox(geoJson), [geoJson]);

    const center = useMemo<[number, number] | undefined>(
        () => (isNotDefined(bounds) ? undefined : getCenterFromBBox(bounds)),
        [bounds],
    );

    const zoomLevel = useMemo(
        () => (isDefined(bounds) ? getOptimalZoomLevel(bounds) : 18),
        [bounds],
    );

    const lineLayerStyle = useMemo(() => ({
        lineWidth: 1,
        lineOpacity: hideLines ? 0 : 0.9,
        lineColor: theme.textOnPrimary as string,
    }), [hideLines, theme]);

    return (
        <View style={[styles.container, style]}>
            <MapView
                // FIXME: use pre-defined values
                style={styles.mapView}
                attributionEnabled={false}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
            >
                <RasterSource
                    id={`${instanceId}-raster-source`}
                    tileUrlTemplates={[
                        standardizeQuadKey(tileServer.url),
                    ]}
                >
                    <RasterLayer
                        id={`${instanceId}-raster-layer`}
                        sourceID={`${instanceId}-raster-source`}
                    />
                </RasterSource>
                <ShapeSource
                    id={`${instanceId}-shape-source`}
                    shape={geoJson}
                >
                    <LineLayer
                        id={`${instanceId}-shape-line-layer`}
                        sourceID={`${instanceId}-shape-source`}
                        style={lineLayerStyle}
                    />
                </ShapeSource>
                {isDefined(center) && (
                    <Camera
                        zoomLevel={zoomLevel}
                        centerCoordinate={center}
                        animationDuration={100}
                    />
                )}
            </MapView>
        </View>
    );
}

export default MapTile;
