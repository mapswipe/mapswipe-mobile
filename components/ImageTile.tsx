import {
    useCallback,
    useState,
} from 'react';
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';

import Icon, { type IconName } from '@/components/Icon';
import ImageLoadError from '@/components/ImageLoadError';
import Modal from '@/components/Modal';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useImageLoadError from '@/hooks/useImageLoadError';
import useThemedStyles from '@/hooks/useThemedStyles';
import upgradeToHttps from '@/utils/url';

// Enlarged tile shown in the long-press preview popup.
const PREVIEW_SIZE = SCREEN_WIDTH - 90;
const COMPACT_ERROR_WIDTH = 150;

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
    previewImage: {
        width: PREVIEW_SIZE,
        aspectRatio: 1,
        alignSelf: 'center',
    },
    previewImageB: {
        width: PREVIEW_SIZE,
        aspectRatio: 1,
        opacity: 0.7,
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

    const [previewVisible, setPreviewVisible] = useState(false);

    const imageLoad = useImageLoadError(url, 'ImageTile');
    const imageBLoad = useImageLoadError(urlB, 'ImageTile:B');
    const { retry: retryA } = imageLoad;
    const { retry: retryB } = imageBLoad;
    const handleRetry = useCallback(() => {
        retryA();
        retryB();
    }, [retryA, retryB]);

    const handlePress = useCallback(() => {
        onPress(taskId);
    }, [taskId, onPress]);

    const handleLongPress = useCallback(() => {
        setPreviewVisible(true);
    }, []);

    const handleClosePreview = useCallback(() => {
        setPreviewVisible(false);
    }, []);

    return (
        <>
            <Pressable
                onPress={handlePress}
                onLongPress={handleLongPress}
                style={styles.imageTile}
            >
                <ImageBackground
                    key={imageLoad.retryKey}
                    source={{ uri: upgradeToHttps(url) }}
                    style={styles.image}
                    onError={imageLoad.onError}
                    onLoad={imageLoad.onLoad}
                >
                    {urlB && (
                        <Image
                            key={imageBLoad.retryKey}
                            source={upgradeToHttps(urlB)}
                            style={styles.imageB}
                            onError={imageBLoad.onError}
                            onLoad={imageBLoad.onLoad}
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
                    {(imageLoad.failed || imageBLoad.failed) && (
                        <ImageLoadError
                            onRetry={handleRetry}
                            compact={width < COMPACT_ERROR_WIDTH}
                        />
                    )}
                </ImageBackground>
            </Pressable>
            {previewVisible && (
                <Modal
                    open="tile-preview"
                    visible
                    onClose={handleClosePreview}
                    closeButtonName="Close"
                >
                    <ImageBackground
                        source={{ uri: upgradeToHttps(url) }}
                        style={styles.previewImage}
                    >
                        {urlB && (
                            <Image
                                source={upgradeToHttps(urlB)}
                                style={styles.previewImageB}
                            />
                        )}
                    </ImageBackground>
                </Modal>
            )}
        </>
    );
}

export default ImageTile;
