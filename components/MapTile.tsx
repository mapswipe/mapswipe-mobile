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
    GeoJSONSource,
    Layer,
    Map,
    type StyleSpecification,
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

    // The style holds only the imagery, so no basemap is fetched underneath.
    // It changes only with the tile server, so the map never reloads its
    // style on swipe or when the outline is hidden.
    const mapStyle = useMemo<StyleSpecification>(() => ({
        version: 8,
        sources: {
            imagery: {
                type: 'raster',
                tiles: [standardizeQuadKey(upgradeToHttps(tileServer.url))],
                // NOTE: maplibre assumes 512 px tiles for non-Mapbox URLs and
                // fetches tile zoom = round(map zoom + log2(512 / tileSize)).
                // The images are 256 px, so 256 fetches imagery one level finer
                // than 512 and draws it at its real size instead of enlarged.
                tileSize: 256,
                minzoom: tileServer.minZoom,
                maxzoom: tileServer.maxZoom,
            },
        },
        layers: [{
            id: 'imagery',
            type: 'raster',
            source: 'imagery',
        }],
    }), [tileServer.url, tileServer.minZoom, tileServer.maxZoom]);

    const linePaint = useMemo(() => ({
        'line-width': 1,
        'line-opacity': hideLines ? 0 : 0.9,
        'line-color': '#ffffff',
    }), [hideLines]);

    return (
        <View style={[styles.container, style]}>
            <Map
                style={styles.mapView}
                mapStyle={mapStyle}
                androidView="texture"
                attribution={false}
                logo={false}
                compass={false}
                dragPan={false}
                touchZoom={false}
                doubleTapZoom={false}
                touchPitch={false}
                touchRotate={false}
            >
                <GeoJSONSource
                    id={`${instanceId}-shape-source`}
                    data={geoJson}
                >
                    <Layer
                        id={`${instanceId}-shape-line-layer`}
                        type="line"
                        paint={linePaint}
                    />
                </GeoJSONSource>
                {isDefined(center) && isDefined(zoomLevel) && (
                    <Camera
                        initialViewState={{ center, zoom: zoomLevel }}
                        zoom={zoomLevel}
                        // NOTE: iOS stops at zoom 22 unless the limit is raised
                        minZoom={MAP_MIN_ZOOM_LEVEL}
                        maxZoom={MAP_MAX_ZOOM_LEVEL}
                        center={center}
                        duration={100}
                        easing="ease"
                    />
                )}
            </Map>
        </View>
    );
}

export default MapTile;
