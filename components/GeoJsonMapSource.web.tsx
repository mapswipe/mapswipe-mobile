'use dom';

import {
    ComponentProps,
    lazy,
    useMemo,
} from 'react';
import { pointToTileFraction } from '@mapbox/tilebelt';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import {
    BoundingBox,
    getBbox,
} from '@/utils/geo';
import { FeatureGeoJson } from '@/utils/types';

const MapBoundsLazy = lazy(async () => {
    const mod = await import('@togglecorp/re-map');
    return { default: mod.MapBounds };
});

const MapCenterLazy = lazy(async () => {
    const mod = await import('@togglecorp/re-map');
    return { default: mod.MapCenter };
});

const MapLayerLazy = lazy(async () => {
    const mod = await import('@togglecorp/re-map');
    return { default: mod.MapLayer };
});

const MapSourceLazy = lazy(async () => {
    const mod = await import('@togglecorp/re-map');
    return { default: mod.MapSource };
});

function getTileZ(bbox: BoundingBox) {
    // check for if bounding box fits into a single tile in width and height
    // at a given zoom level
    // start to check for zoom level 19 and
    // then go to lower levels when needed
    // zoom level 19 is considered here as the maximum zoom that we support
    // zoom level 14 is the minimum zoom level
    let tileZ = 19;
    while (tileZ >= 14) {
        // get the tiles for the bbox coordinates
        const tileAFraction = pointToTileFraction(
            bbox[0],
            bbox[1],
            tileZ,
        );
        const tileBFraction = pointToTileFraction(
            bbox[2],
            bbox[3],
            tileZ,
        );

        // check if bbox fits into one tile at this zoom level
        // need to check in x and y dimensions
        const yDifference = Math.abs(tileAFraction[0] - tileBFraction[0]);
        const xDifference = Math.abs(tileAFraction[1] - tileBFraction[1]);

        if (yDifference < 1 && xDifference < 1) {
            // x dimension and y dimension fit into a box with the size of one tile
            break;
        }
        tileZ -= 1;
    }
    return tileZ;
}

const geoJsonSourceOptions: Omit<maplibregl.GeoJSONSourceSpecification, 'data'> = {
    type: 'geojson',
};

const geoJsonLayerOptions: ComponentProps<typeof MapLayerLazy>['layerOptions'] = {
    type: 'line',
    paint: {
        'line-color': '#ffffff',
        'line-width': 2,
        'line-opacity': 1,
    },
    layout: {
        visibility: 'visible',
    },
};

interface Props {
    geoJson: FeatureGeoJson | undefined;
    sourceKey: string;
    layerKey: string;
    layerOptions?: typeof geoJsonLayerOptions;

    overrideZoomLevel?: number;
    overrideBounds?: GeoJSON.Polygon | null;
    withPadding?: boolean;
}

function GeoJsonMapSource(props: Props) {
    const {
        geoJson,
        overrideZoomLevel,
        sourceKey,
        layerKey,
        withPadding,
        layerOptions = geoJsonLayerOptions,
        overrideBounds,
    } = props;

    const bounds = useMemo(
        () => {
            if (isDefined(overrideBounds)) {
                return getBbox(overrideBounds);
            }

            if (isDefined(geoJson)) {
                return getBbox(geoJson as GeoJSON.GeoJSON);
            }

            return undefined;
        },
        [geoJson, overrideBounds],
    );

    const zoomLevel = useMemo(
        () => {
            if (isDefined(overrideZoomLevel)) {
                return overrideZoomLevel;
            }

            if (isDefined(bounds)) {
                return getTileZ(bounds) - 1;
            }

            return undefined;
        },
        [bounds, overrideZoomLevel],
    );

    const center = useMemo<[number, number] | undefined>(() => {
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
    }, [bounds]);

    return (
        <>
            {isDefined(geoJson) && (
                <MapSourceLazy
                    key={sourceKey}
                    sourceKey={sourceKey}
                    sourceOptions={geoJsonSourceOptions}
                    geoJson={geoJson as GeoJSON.FeatureCollection}
                >
                    <MapLayerLazy
                        key={layerKey}
                        layerKey={layerKey}
                        layerOptions={layerOptions}
                    />
                </MapSourceLazy>
            )}
            {isNotDefined(zoomLevel) && isDefined(bounds) && (
                <MapBoundsLazy
                    bounds={bounds}
                    duration={0}
                    padding={withPadding ? 20 : 0}
                />
            )}
            {isDefined(zoomLevel) && isDefined(center) && (
                <MapCenterLazy
                    center={center}
                    centerOptions={{
                        zoom: zoomLevel,
                        duration: 0,
                        padding: withPadding ? 20 : 0,
                    }}
                />
            )}
        </>
    );
}

export default GeoJsonMapSource;
