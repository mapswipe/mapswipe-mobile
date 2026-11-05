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

import useThemedStyles from '@/hooks/useThemedStyles';
import {
    getBbox,
    MAP_MAX_ZOOM_LEVEL,
    MAP_MIN_ZOOM_LEVEL,
    standardizeQuadKey,
} from '@/utils/geo';
import { FbObjRasterTileServer } from '@/utils/types';
import upgradeToHttps from '@/utils/url';

interface Props {
    geoJson: GeoJSON.GeoJSON;
    tileServer: FbObjRasterTileServer;
    hideLines?: boolean;
    zoomLevel?: number;
    // Applied to the tile container, e.g. `{ flex: 1 }` so the map fills a
    // flex slot (the container otherwise sizes to content and can collapse).
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
        zoomLevel,
        style,
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

    const lineLayerStyle = useMemo(() => ({
        lineWidth: 1,
        lineOpacity: hideLines ? 0 : 0.9,
        lineColor: '#ffffff' as string,
    }), [hideLines]);

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
                    // NOTE: maplibre assumes 512 px tiles for non-Mapbox URLs and
                    // fetches tile zoom = round(map zoom + log2(512 / tileSize)).
                    // The images are 256 px, so 256 fetches imagery one level finer
                    // than 512 and draws it at its real size instead of enlarged.
                    tileSize={256}
                    minZoomLevel={tileServer.minZoom}
                    maxZoomLevel={tileServer.maxZoom}
                    tileUrlTemplates={[
                        standardizeQuadKey(upgradeToHttps(tileServer.url)),
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
                {isDefined(center) && isDefined(zoomLevel) && (
                    <Camera
                        zoomLevel={zoomLevel}
                        // NOTE: iOS stops at zoom 22 unless the limit is raised
                        minZoomLevel={MAP_MIN_ZOOM_LEVEL}
                        maxZoomLevel={MAP_MAX_ZOOM_LEVEL}
                        centerCoordinate={center}
                        animationDuration={100}
                    />
                )}
            </MapView>
        </View>
    );
}

export default MapTile;
