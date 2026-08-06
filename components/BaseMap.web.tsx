'use dom';

import {
    lazy,
    useMemo,
} from 'react';
import {
    isNotDefined,
    randomString,
} from '@togglecorp/fujs';

import { standardizeQuadKey } from '@/utils/geo';
import { FbObjRasterTileServer } from '@/utils/types';

const MapLazy = lazy(async () => {
    const mod = await import('@togglecorp/re-map');
    return { default: mod.default };
});

const defaultMapOptions: Omit<maplibregl.MapOptions, 'container' | 'style' | 'children'> = {
    center: [0, 0],
    zoom: 1,
    attributionControl: false,
    scrollZoom: false,
    boxZoom: false,
    doubleClickZoom: false,
    touchZoomRotate: false,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    dragPan: false,
};

interface Props {
    baseTileServer: FbObjRasterTileServer;
    children?: React.ReactNode;
    tileSize?: number;
}

function BaseMap(props: Props) {
    const {
        baseTileServer,
        children,
        tileSize = 512,
    } = props;

    const {
        url,
        credits,
    } = baseTileServer;

    const mapStyle = useMemo(() => {
        const spec: maplibregl.StyleSpecification = {
            version: 8,
            sources: {
                'base-tile-source': {
                    type: 'raster',
                    // NOTE: maplibre uses `quadkey` but mapswipe backend uses `quad_key`
                    tiles: [standardizeQuadKey(url)],
                    tileSize,
                    attribution: credits ?? '',
                },
            },
            layers: [{
                id: 'base-tile-layer',
                type: 'raster',
                source: 'base-tile-source',
            }],
        };
        return spec;
    }, [url, credits, tileSize]);

    const mapKey = useMemo(() => (
        // FIXME(frozenhelium): new key recreates the map to dodge a layer/source race.
        randomString()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [mapStyle]);

    if (isNotDefined(mapStyle)) {
        return null;
    }

    return (
        <MapLazy
            key={mapKey}
            mapStyle={mapStyle}
            mapOptions={defaultMapOptions}
        >
            {children}
        </MapLazy>
    );
}

export default BaseMap;
