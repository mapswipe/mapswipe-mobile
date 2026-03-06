// FIXME: Use everything
/* eslint-disable react/no-unused-prop-types */
import { View } from 'react-native';

import Text from '@/components/Text';

interface Props {
    geoJson: (
        GeoJSON.FeatureCollection<GeoJSON.Geometry>
        | GeoJSON.Feature<GeoJSON.Geometry>
        | GeoJSON.Geometry
        | undefined | null
    );
    sourceKey: string;
    layerKey: string;
    layerOptions?: unknown;
    overrideZoomLevel?: number;
    overrideBounds?: GeoJSON.Polygon | null;
    withPadding?: boolean;
}

function GeoJsonMapSource(props: Props) {
    return (
        <View>
            <Text>
                Only for web
            </Text>
        </View>
    );
}

export default GeoJsonMapSource;
