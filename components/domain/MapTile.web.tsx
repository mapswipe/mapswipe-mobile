import {
    lazy,
    useMemo,
} from 'react';
import {
    StyleSheet,
    useWindowDimensions,
    View,
} from 'react-native';

import BaseMap from '@/components/BaseMap';
import GeoJsonMapSource from '@/components/GeoJsonMapSource';
import { AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    FbObjRasterTileServer,
    FeatureGeoJson,
} from '@/utils/types';

const MapContainerLazy = lazy(async () => {
    const mod = await import('@togglecorp/re-map');
    return { default: mod.MapContainer };
});

interface Props {
    geoJson: FeatureGeoJson;
    tileServer: FbObjRasterTileServer;
    hideLines?: boolean;
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
        hideLines = false,
    } = props;

    const { height } = useWindowDimensions();
    const theme = useTheme();
    const styles = useThemedStyles(createStyles, { height });

    const layerOptions = useMemo(() => ({
        type: 'line' as const,
        paint: {
            'line-color': theme.mapFeatureLine,
            'line-width': 2,
            'line-opacity': hideLines ? 0 : 1,
        },
        layout: {
            visibility: 'visible' as const,
        },
    }), [hideLines, theme]);

    return (
        <View
            style={styles.mainContent}
        >
            <BaseMap baseTileServer={tileServer}>
                <GeoJsonMapSource
                    geoJson={geoJson}
                    sourceKey="shape-source"
                    layerKey="shape-line-layer"
                    layerOptions={layerOptions}
                />
                <MapContainerLazy
                    style={styles.mapContainerLazy}
                />
            </BaseMap>
        </View>
    );
}

export default MapTile;
