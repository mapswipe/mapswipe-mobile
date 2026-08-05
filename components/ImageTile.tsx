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

import Modal from '@/components/Modal';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import {
    ICON_GLYPH,
    type IconName,
} from '@/constants/icons';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

// Enlarged tile shown in the long-press preview popup.
const PREVIEW_SIZE = SCREEN_WIDTH - 90;

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

    const handlePress = useCallback(() => {
        onPress(taskId);
    }, [taskId, onPress]);

    const handleLongPress = useCallback(() => {
        setPreviewVisible(true);
    }, []);

    const handleClosePreview = useCallback(() => {
        setPreviewVisible(false);
    }, []);

    const BadgeGlyph = accessibilityBadgeIconName === undefined
        ? undefined
        : ICON_GLYPH[accessibilityBadgeIconName];

    return (
        <>
            <Pressable
                onPress={handlePress}
                onLongPress={handleLongPress}
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
                            {BadgeGlyph !== undefined && (
                                <BadgeGlyph
                                    color="#ffffff"
                                    size={14}
                                    weight="bold"
                                />
                            )}
                        </View>
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
                        source={{ uri: url }}
                        style={styles.previewImage}
                    >
                        {urlB && (
                            <Image
                                source={urlB}
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
