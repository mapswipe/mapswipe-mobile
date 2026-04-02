import { lazy } from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    FbObjRasterTileServer,
    FeatureGeoJson,
} from '@/utils/types';

import BaseMap from './BaseMap';
import GeoJsonMapSource from './GeoJsonMapSource';

const MapContainerLazy = lazy(async () => {
    const mod = await import('@togglecorp/re-map');
    return { default: mod.MapContainer };
});

interface Props {
    geoJson: FeatureGeoJson;
    tileServer: FbObjRasterTileServer;
}

const createStyles = (theme: AppTheme, { height }:
     {height: number}) => StyleSheet.create({
    mainContent: {
        width: '100%',
        height: height * 0.6,
    },
    mapContainerLazy: {
        width: '100%',
        height: '100%',
    },

});

function MapTile(props: Props) {
    const {
        geoJson,
        tileServer,
    } = props;
    const { height } = useWindowDimensions();
    const styles = useThemedStyles(createStyles, { height });
    return (
        <View
            style={styles.mainContent}
        >
            <BaseMap baseTileServer={tileServer}>
                <GeoJsonMapSource
                    geoJson={geoJson}
                    sourceKey="shape-source"
                    layerKey="shape-line-layer"
                />
                <MapContainerLazy
                    style={styles.mapContainerLazy}
                />
            </BaseMap>
        </View>
    );
}

export default MapTile;
