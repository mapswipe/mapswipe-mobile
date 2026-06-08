import {
    useCallback,
    useMemo,
    useState,
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
    standardizeQuadKey,
} from '@/utils/geo';
import { FbObjRasterTileServer } from '@/utils/types';

import HideTileSelectionButton from './HideTileSelectionButton';

interface Props {
    geoJson: GeoJSON.GeoJSON;
    tileServer: FbObjRasterTileServer;
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
    hideButton: {
        position: 'absolute',
        bottom: 0,
        alignSelf: 'center',
    },
});
function MapTile(props: Props) {
    const {
        geoJson,
        tileServer,
    } = props;

    const styles = useThemedStyles(createStyles);
    const [hideShapeSource, setHideShapeSource] = useState<boolean>(false);

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

    const handleHideTilePressIn = useCallback(() => {
        setHideShapeSource(true);
    }, []);

    const handleHideTilePressOut = useCallback(() => {
        setHideShapeSource(false);
    }, []);

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
                            visibility: hideShapeSource ? 'none' : 'visible',
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
            <View style={styles.hideButton}>
                <HideTileSelectionButton
                    isPressed={hideShapeSource}
                    handleHideTileSelectionPressIn={handleHideTilePressIn}
                    handleHideTileSelectionPressOut={handleHideTilePressOut}
                    size="large"
                />
            </View>
        </View>
    );
}

export default MapTile;
