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
    getOptimalZoomLevel,
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
                        zoomLevel={zoomLevel}
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
