import { FbObjRasterTileServer } from "@/utils/types";
import { View } from "react-native";
import Text from "@/components/Text";

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

    return (
        <View>
            <Text>
                Only for web
            </Text>
        </View>
    );
}

export default BaseMap;
