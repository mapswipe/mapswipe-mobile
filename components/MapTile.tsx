import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
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
    standardizeQuadKey,
} from '@/utils/geo';
import { FbObjRasterTileServer } from '@/utils/types';

interface Props {
    geoJson: GeoJSON.GeoJSON;
    tileServer: FbObjRasterTileServer;
}

const createStyles = () => StyleSheet.create({
    mapView: {
        width: '100%',
        aspectRatio: 0.8,
    },
});
function MapTile(props: Props) {
    const {
        geoJson,
        tileServer,
    } = props;

    const styles = useThemedStyles(createStyles);

    const center = useMemo<[number, number] | undefined>(() => {
        const bounds = getBbox(geoJson);

        if (isNotDefined(bounds)) {
            return undefined;
        }

        const x1 = bounds[0];
        const y1 = bounds[1];
        const x2 = bounds[2];
        const y2 = bounds[3];

        const centerX = (x1 + x2) / 2;
        const centerY = (y1 + y2) / 2;

        return [centerX, centerY];
    }, [geoJson]);

    return (
        <MapView
            // FIXME: use pre-defined values
            style={styles.mapView}
            attributionEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
        >
            <RasterSource
                id="base-raster-source"
                tileUrlTemplates={[
                    standardizeQuadKey(tileServer.url),
                ]}
            >
                <RasterLayer
                    id="base-raster-layer"
                    sourceID="base-raster-source"
                />
            </RasterSource>
            <ShapeSource
                id="shape-source"
                shape={geoJson}
            >
                <LineLayer
                    id="shape-line-layer"
                    sourceID="shape-source"
                    // eslint-disable-next-line react-native/no-inline-styles
                    style={{
                        lineWidth: 1,
                        lineOpacity: 0.9,
                        lineColor: '#ffffff',
                    }}
                />
            </ShapeSource>
            {isDefined(center) && (
                <Camera
                    zoomLevel={18}
                    centerCoordinate={center}
                    animationDuration={100}
                />
            )}
        </MapView>
    );
}

export default MapTile;
