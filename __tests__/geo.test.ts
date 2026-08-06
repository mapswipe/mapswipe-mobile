import {
    type BoundingBox,
    getBbox,
    getCenterFromBBox,
    getOptimalZoomLevel,
    getZoomLevelFromBbox,
    standardizeQuadKey,
} from '@/utils/geo';

const TINY: BoundingBox = [115.26, -8.68, 115.2601, -8.6799];
const CITY: BoundingBox = [115.2, -8.7, 115.3, -8.6];
const WORLD: BoundingBox = [-180, -85, 180, 85];

describe('getCenterFromBBox', () => {
    it('is the midpoint, longitude first', () => {
        expect(getCenterFromBBox([0, 0, 10, 20])).toEqual([5, 10]);
    });

    it('handles negative coordinates', () => {
        expect(getCenterFromBBox([-10, -20, 10, 20])).toEqual([0, 0]);
    });

    it('falls back to the null island when unmeasured', () => {
        expect(getCenterFromBBox(undefined)).toEqual([0, 0]);
    });
});

describe('getBbox', () => {
    it('bounds a polygon', () => {
        const geoJson: GeoJSON.GeoJSON = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [[[0, 0], [2, 0], [2, 3], [0, 3], [0, 0]]],
            },
        };
        expect(getBbox(geoJson)).toEqual([0, 0, 2, 3]);
    });

    it('returns undefined without geometry', () => {
        expect(getBbox(undefined)).toBeUndefined();
    });
});

describe('getOptimalZoomLevel', () => {
    it('returns the deepest zoom for a bbox inside one tile', () => {
        expect(getOptimalZoomLevel(TINY)).toBe(19);
    });

    // 13, not 14: the loop guard is `z >= 14`, so a bbox that does not fit at 14 falls through.
    it.each([
        ['a city-sized bbox', CITY],
        ['the whole world', WORLD],
    ] as const)('drops to 13 for %s', (_label, bbox) => {
        expect(getOptimalZoomLevel(bbox)).toBe(13);
    });

    it('never returns a zoom deeper than 19', () => {
        expect(getOptimalZoomLevel([0, 0, 0, 0])).toBeLessThanOrEqual(19);
    });
});

describe('getZoomLevelFromBbox', () => {
    it('is the tile zoom that contains the bbox', () => {
        expect(getZoomLevelFromBbox(TINY)).toBeGreaterThan(getZoomLevelFromBbox(WORLD));
    });

    it('falls back to 14 when unmeasured', () => {
        expect(getZoomLevelFromBbox(undefined)).toBe(14);
    });
});

describe('standardizeQuadKey', () => {
    it('rewrites the backend spelling to maplibre’s', () => {
        expect(standardizeQuadKey('https://t/{quad_key}.png')).toBe('https://t/{quadkey}.png');
    });

    it('leaves an already-standard template alone', () => {
        expect(standardizeQuadKey('https://t/{quadkey}.png')).toBe('https://t/{quadkey}.png');
    });
});
