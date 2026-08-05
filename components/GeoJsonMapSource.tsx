import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';

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

// Native stub: GeoJsonMapSource.web.tsx is the real implementation, so every prop is ignored here.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GeoJsonMapSource(_props: Props) {
    return (
        <Box>
            <Text>
                Only for web
            </Text>
        </Box>
    );
}

export default GeoJsonMapSource;
