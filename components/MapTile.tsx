import {
    useId,
    useMemo,
} from 'react';
import {
    StyleSheet,
    View,
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

import useThemedStyles from '@/hooks/useThemedStyles';
import {
    getBbox,
    getOptimalZoomLevel,
    standardizeQuadKey,
} from '@/utils/geo';
import { FbObjRasterTileServer } from '@/utils/types';

interface Props {
    geoJson: GeoJSON.GeoJSON;
    tileServer: FbObjRasterTileServer;
    hideLines?: boolean;
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
    } = props;

    const instanceId = useId();

    const styles = useThemedStyles(createStyles);

    const bounds = useMemo(() => getBbox(geoJson), [geoJson]);

    const center = useMemo<[number, number] | undefined>(() => {
        if (isNotDefined(bounds)) {
            return undefined;
        }
        return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
    }, [bounds]);

    const zoomLevel = useMemo(
        () => (isDefined(bounds) ? getOptimalZoomLevel(bounds) : 18),
        [bounds],
    );

    const lineLayerStyle = useMemo(() => ({
        lineWidth: 1,
        lineOpacity: hideLines ? 0 : 0.9,
        lineColor: '#ffffff' as string,
    }), [hideLines]);

    return (
        <View style={styles.container}>
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
