import { useCallback } from 'react';
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';

import Icon, { type IconName } from '@/components/Icon';
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
    imageB: {
        width,
        aspectRatio: 1,
        opacity: 0.7,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 255, 255, 0.2)',
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
    accessibilityBadge: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: 24,
        height: 24,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

interface Props<TASK_ID> {
    taskId: TASK_ID;
    onPress: (taskId: TASK_ID) => void;
    url: string;
    urlB: string | undefined;
    width: number;
    tintColor?: string;
    accessibilityBadgeIconName?: IconName;
    accessibilityBadgeColor?: string;
}

function ImageTile<const TASK_ID>(props: Props<TASK_ID>) {
    const {
        taskId,
        onPress,
        url,
        urlB,
        width,
        tintColor,
        accessibilityBadgeIconName,
        accessibilityBadgeColor,
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
            <ImageBackground
                source={{ uri: url }}
                style={styles.image}
            >
                {urlB && (
                    <Image
                        source={urlB}
                        style={styles.imageB}
                    />
                )}
                <View
                    style={styles.view}
                />
                {accessibilityBadgeIconName && accessibilityBadgeColor && (
                    <View
                        style={[
                            styles.accessibilityBadge,
                            { backgroundColor: accessibilityBadgeColor },
                        ]}
                    >
                        <Icon
                            name={accessibilityBadgeIconName}
                            color="#ffffff"
                            size={14}
                            weight="bold"
                        />
                    </View>
                )}
            </ImageBackground>
        </Pressable>
    );
}

export default ImageTile;
