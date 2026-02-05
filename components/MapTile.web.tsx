import { lazy } from "react";
import { View } from "react-native";

import BaseMap from "./BaseMap";
import GeoJsonMapSource from "./GeoJsonMapSource";
import { FbObjRasterTileServer, FeatureGeoJson } from "@/utils/types";

const MapContainerLazy = lazy(async () => {
    const mod = await import("@togglecorp/re-map");
    return { default: mod.MapContainer };
});

interface Props {
    geoJson: FeatureGeoJson;
    tileServer: FbObjRasterTileServer;
}

function MapTile(props: Props) {
    const {
        geoJson,
        tileServer,
    } = props;

    return (
        <View
            style={{
                width: '100%',
                height: '60vh',
            }}
        >
            <BaseMap baseTileServer={tileServer}>
                <GeoJsonMapSource
                    geoJson={geoJson}
                    sourceKey="shape-source"
                    layerKey="shape-line-layer"
                />
                <MapContainerLazy
                    style={{
                        width: '100%',
                        height: '100%',
                    }}
                />
            </BaseMap>
        </View>
    );

}

export default MapTile;
