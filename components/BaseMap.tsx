import Box from '@/components/ui/Box';
import Text from '@/components/ui/Text';
import { FbObjRasterTileServer } from '@/utils/types';

interface Props {
    baseTileServer: FbObjRasterTileServer;
    children?: React.ReactNode;
    tileSize?: number;
}

// Native stub: BaseMap.web.tsx is the real implementation.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BaseMap(_props: Props) {
    return (
        <Box>
            <Text>
                Only for web
            </Text>
        </Box>
    );
}

export default BaseMap;
