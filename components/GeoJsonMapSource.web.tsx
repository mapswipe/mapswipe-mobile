'use dom';

import {
    ComponentProps,
    lazy,
    useMemo,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import {
    getBbox,
    getOptimalZoomLevel,
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

const geoJsonSourceOptions: Omit<maplibregl.GeoJSONSourceSpecification, 'data'> = {
    type: 'geojson',
};

type GeoJsonLayerOptions = ComponentProps<typeof MapLayerLazy>['layerOptions'];

interface Props {
    geoJson: FeatureGeoJson | undefined;
    sourceKey: string;
    layerKey: string;
    // 'use dom' renders in its own root inside a WebView with no theme context, so colours
    // must arrive from the native caller.
    layerOptions: GeoJsonLayerOptions;

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
        layerOptions,
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
                return getOptimalZoomLevel(bounds) - 1;
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
