import {
    useCallback,
    useState,
} from 'react';
import {
    ImageBackground,
    type ImageStyle,
    Pressable,
    View,
    type ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';

import Modal from '@/components/ui/Modal';
import {
    BORDER_WIDTH_HAIRLINE,
    BORDER_WIDTH_THIN,
} from '@/constants/border';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import {
    ICON_GLYPH,
    type IconName,
} from '@/constants/icons';
import {
    OPACITY_TILE_TINT,
    OPACITY_TILE_UNDERLAY,
} from '@/constants/opacity';
import { RADIUS } from '@/constants/radius';
import { ICON_SIZE } from '@/constants/size';
import { type AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { getSpacingValue } from '@/utils/styles';

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
): {
    imageTile: ViewStyle;
    image: ImageStyle;
    imageB: ImageStyle;
    view: ViewStyle;
    accessibilityBadge: ViewStyle;
    previewImage: ImageStyle;
    previewImageB: ImageStyle;
} => ({
    imageTile: {
        position: 'relative',
        userSelect: 'none',
    },
    image: {
        width,
        aspectRatio: 1,
        borderColor: theme.mapBoundary,
        borderWidth: BORDER_WIDTH_THIN,
    },
    imageB: {
        width,
        aspectRatio: 1,
        opacity: OPACITY_TILE_UNDERLAY,
        borderWidth: BORDER_WIDTH_HAIRLINE,
        borderColor: theme.trackOnImage,
    },
    view: {
        // Inset to all edges, since the raw-size lint rule reads a 100% size as a literal.
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        backgroundColor: tintColor,
        opacity: OPACITY_TILE_TINT,
    },
    accessibilityBadge: {
        position: 'absolute',
        top: getSpacingValue('4xs'),
        left: getSpacingValue('4xs'),
        width: ICON_SIZE['2xl'],
        height: ICON_SIZE['2xl'],
        borderRadius: RADIUS['2xs'],
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
    style?: never;
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

    const theme = useTheme();
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
                                    color={theme.textOnPrimary}
                                    size={ICON_SIZE.md}
                                    weight="bold"
                                />
                            )}
                        </View>
                    )}
                </ImageBackground>
            </Pressable>
            {previewVisible && (
                <Modal
                    visible
                    onClose={handleClosePreview}
                    closeLabel="Close"
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
