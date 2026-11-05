import { viewport } from '@mapbox/geo-viewport';
import {
    bboxToTile,
    pointToTileFraction,
    tileToGeoJSON,
} from '@mapbox/tilebelt';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import turfBbox from '@turf/bbox';

export type BoundingBox = [number, number, number, number];

export function getCenterFromBBox(bbox: BoundingBox | undefined): [number, number] {
    if (isNotDefined(bbox)) {
        return [0, 0];
    }

    const [minLon, minLat, maxLon, maxLat] = bbox;
    const centerLon = (minLon + maxLon) / 2;
    const centerLat = (minLat + maxLat) / 2;
    return [centerLon, centerLat] as const; // [longitude, latitude]
}

export function getBbox(geoJson: GeoJSON.GeoJSON | undefined): BoundingBox | undefined {
    if (isNotDefined(geoJson)) {
        return undefined;
    }

    const bounds = turfBbox(geoJson);
    return [bounds[0], bounds[1], bounds[2], bounds[3]];
}

export function getZoomLevelFromBbox(bbox: BoundingBox | undefined) {
    if (isNotDefined(bbox)) {
        return 14;
    }

    const tile = bboxToTile(bbox);
    return tile[2];
}

export function getOptimalZoomLevel(bbox: BoundingBox): number {
    let z = 19;
    while (z >= 14) {
        const tileA = pointToTileFraction(bbox[0], bbox[1], z);
        const tileB = pointToTileFraction(bbox[2], bbox[3], z);

        if (Math.abs(tileA[0] - tileB[0]) < 1 && Math.abs(tileA[1] - tileB[1]) < 1) {
            break;
        }
        z -= 1;
    }
    return z;
}

const MAPLIBRE_WORLD_SIZE = 512;

// NOTE: The view limit, not the imagery limit. Each layer's own zoom range
// goes to its raster source, and tiles above it are enlarged.
export const MAP_MIN_ZOOM_LEVEL = 0;
export const MAP_MAX_ZOOM_LEVEL = 24;
// NOTE: Keeps a point or very small feature from starting at the view limit
const MAP_MAX_FIT_ZOOM_LEVEL = 22;

export const SCALE_BAR_REFERENCE_SIZE = 256;
export function getScaleBarZoomLevel(mapLibreZoom: number) {
    return mapLibreZoom + 1;
}

// Zoom at which the bbox fits the given size with padding, like MapLibre's
// fitBounds. MapLibre's world is 512px wide at zoom 0, hence the tile size.
export function getFitZoomLevel(
    bbox: BoundingBox,
    width: number,
    height: number,
    paddingRatio = 0.1,
): number {
    const usable = 1 - 2 * paddingRatio;
    return viewport(
        bbox,
        [width * usable, height * usable],
        MAP_MIN_ZOOM_LEVEL,
        MAP_MAX_FIT_ZOOM_LEVEL,
        MAPLIBRE_WORLD_SIZE,
        true,
    ).zoom;
}

export function standardizeQuadKey(url: string) {
    // NOTE: maplibre uses `quadkey` but mapswipe backend uses `quad_key`
    return url.replace('{quad_key}', '{quadkey}');
}

export function createGeoJsonFromTiles(
    tiles: {
        tileX: number | undefined,
        tileY: number | undefined,
        tileZ: number | undefined,
        reference: number | undefined,
    }[] | undefined,
) {
    if (isNotDefined(tiles) || tiles.length === 0) {
        return undefined;
    }

    const tilesSafe = tiles.map((tile) => {
        const {
            tileX,
            tileY,
            tileZ,
        } = tile;

        if (isNotDefined(tileX) || isNotDefined(tileY) || isNotDefined(tileZ)) {
            return undefined;
        }

        return {
            ...tile,
            tileX,
            tileY,
            tileZ,
        };
    }).filter(isDefined);

    if (tilesSafe.length === 0) {
        return undefined;
    }

    const geojson: GeoJSON.GeoJSON = {
        type: 'FeatureCollection' as const,
        features: tilesSafe.map((tile) => {
            const {
                tileX,
                tileY,
                tileZ,
                reference,
            } = tile;

            const feature = {
                type: 'Feature' as const,
                geometry: tileToGeoJSON([tileX, tileY, tileZ]),
                properties: {
                    tile_x: tileX,
                    tile_y: tileY,
                    tile_z: tileZ,
                    reference: reference ?? 0,
                },
            };

            return feature;
        }).filter(isDefined),
    };

    return geojson;
}
