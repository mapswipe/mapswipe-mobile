import { Pressable, View } from "react-native";
import { Image } from "expo-image";
import useTheme from "@/hooks/useTheme";
import { useCallback } from "react";

interface Props<TASK_ID> {
    taskId: TASK_ID;
    onPress: (taskId: TASK_ID) => void;
    url: string | undefined;
    width: number;
    tintColor?: string;
}

function ImageTile<const TASK_ID>(props: Props<TASK_ID>) {
    const {
        taskId,
        onPress,
        url,
        width,
        tintColor,
    } = props;

    const theme = useTheme();

    const handlePress = useCallback(() => {
        onPress(taskId);
    }, [taskId]);

    return (
        <Pressable
            onPress={handlePress}
            style={{
                position: 'relative',
                userSelect: 'none',
            }}
        >
            <Image
                source={url}
                style={{
                    width,
                    aspectRatio: 1,
                    borderColor: theme.mapBoundary,
                    borderWidth: 1,
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: tintColor,
                    opacity: 0.2,
                }}
            />
        </Pressable>
    );
}

export default ImageTile;
