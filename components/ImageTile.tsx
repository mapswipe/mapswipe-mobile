import { useCallback } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';

import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = (
    theme: AppTheme,
    {
        width,
        tintColor,
    }: {
        tintColor?: string,
        width: number,
    },
) => StyleSheet.create({
    imageTile: {
        position: 'relative',
        userSelect: 'none',
    },
    image: {
        width,
        aspectRatio: 1,
        borderColor: theme.mapBoundary,
        borderWidth: 1,
    },
    view: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: tintColor,
        opacity: 0.2,
    },
});

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

    const styles = useThemedStyles(createStyles, { width, tintColor });

    const handlePress = useCallback(() => {
        onPress(taskId);
    }, [taskId, onPress]);

    return (
        <Pressable
            onPress={handlePress}
            style={styles.imageTile}
        >
            <Image
                source={url}
                style={styles.image}
            />
            <View
                style={styles.view}
            />
        </Pressable>
    );
}

export default ImageTile;
