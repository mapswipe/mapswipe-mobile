import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    ActivityIndicator,
    Image,
    LayoutChangeEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { SCREEN_WIDTH } from '@/constants/dimensions';

const styles = StyleSheet.create({
    container: {
        flex: 2,
        justifyContent: 'center',
        position: 'relative', // add this
        alignItems: 'center',
        width: SCREEN_WIDTH,
        backgroundColor: '#fff',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        resizeMode: 'contain',
    },
    loader: {
        position: 'absolute',
        zIndex: 1,
    },
    retryContainer: {
        alignItems: 'center',
    },
    retryText: {
        color: 'white',
        fontSize: 16,
        marginTop: 10,
    },
    svg: {
        zIndex: 11,
    },
});

interface ImageDimensions {
    clientHeight?: number;
    clientWidth?: number;
    naturalHeight?: number;
    naturalWidth?: number;
}

interface BboxResult {
    x: string;
    y: string;
    width: string;
    height: string;
}

function calculateBbox(
    imageDimensions: ImageDimensions | undefined,
    bbox: [number, number, number, number] | undefined,
): BboxResult | undefined {
    if (!imageDimensions || !bbox) return undefined;
    const {
        naturalHeight, naturalWidth, clientHeight, clientWidth,
    } = imageDimensions;
    if (!naturalHeight || !naturalWidth || !clientHeight || !clientWidth) return undefined;

    const containerAspectRatio = clientWidth / clientHeight;
    const imageAspectRatio = naturalWidth / naturalHeight;

    const renderedHeight = imageAspectRatio > containerAspectRatio
        ? clientWidth / imageAspectRatio
        : clientHeight;

    const renderedWidth = containerAspectRatio > imageAspectRatio
        ? clientHeight * imageAspectRatio
        : clientWidth;

    const xExcess = clientWidth - renderedWidth;
    const yExcess = clientHeight - renderedHeight;

    const [x1, y1, w, h] = bbox;

    return {
        x: `${(x1 / naturalWidth) * renderedWidth + xExcess / 2}px`,
        y: `${(y1 / naturalHeight) * renderedHeight + yExcess / 2}px`,
        width: `${(w / naturalWidth) * renderedWidth}px`,
        height: `${(h / naturalHeight) * renderedHeight}px`,
    };
}

interface ImageWrapperProps {
    item: { url: string };
    itemIndex: number;
    onImageLoadStart: (itemKey: number) => void;
    onImageLoadEnd: (itemKey: number) => void;
    bbox: [number, number, number, number] | undefined;
}

export default function ImageWrapper({
    item,
    itemIndex,
    onImageLoadStart,
    onImageLoadEnd,
    bbox,
}: ImageWrapperProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [imageDimensions, setImageDimensions] = useState<ImageDimensions>();

    useEffect(() => {
        onImageLoadStart(itemIndex);
    }, [onImageLoadStart, itemIndex]);

    const handleLoadStart = useCallback(() => {
        onImageLoadStart(itemIndex);
        setLoading(true);
    }, [onImageLoadStart, itemIndex]);

    const handleError = useCallback(() => {
        setLoading(false);
        setError(true);
    }, []);

    const handleRetry = useCallback(() => {
        setLoading(true);
        setError(false);
        setRetryKey((k) => k + 1);
    }, []);

    const handleLoadEnd = useCallback(() => {
        onImageLoadEnd(itemIndex);
        setLoading(false);

        if (item.url) {
            Image.getSize('https://i.imgur.com/t3WOlrJ.jpeg', (width, height) => {
                setImageDimensions((prev) => ({
                    ...prev,
                    naturalWidth: width,
                    naturalHeight: height,
                }));
            });
        }
    }, [item.url, onImageLoadEnd, itemIndex]);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setImageDimensions((prev) => ({
            ...prev,
            clientWidth: width,
            clientHeight: height,
        }));
    }, []);

    const bboxForBox = calculateBbox(imageDimensions, bbox);

    const scale = useSharedValue(1);
    const focalX = useSharedValue(0);
    const focalY = useSharedValue(0);
    const baseScale = useSharedValue(1);
    const lastFocalX = useSharedValue<number | null>(null);
    const lastFocalY = useSharedValue<number | null>(null);

    const pinchGesture = Gesture.Pinch()
        .onBegin(() => {
            baseScale.value = scale.value;
            lastFocalX.value = null;
            lastFocalY.value = null;
        })
        .onUpdate((e) => {
            const newScale = baseScale.value * e.scale;

            const deltaX = lastFocalX.value != null ? e.focalX - lastFocalX.value : 0;
            const deltaY = lastFocalY.value != null ? e.focalY - lastFocalY.value : 0;

            lastFocalX.value = e.focalX;
            lastFocalY.value = e.focalY;

            scale.value = newScale;
            focalX.value += deltaX;
            focalY.value += deltaY;
        })
        .onEnd(() => {
            baseScale.value = 1;
            lastFocalX.value = null;
            lastFocalY.value = null;
            scale.value = 1;
            focalX.value = 0;
            focalY.value = 0;
        });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: -focalX.value },
            { translateY: -focalY.value },
            { scale: scale.value },
            { translateX: focalX.value },
            { translateY: focalY.value },
        ],
    }));
    return (
        <GestureDetector gesture={pinchGesture}>
            <View onLayout={handleLayout} style={styles.container}>
                {loading && (
                    <ActivityIndicator
                        size="large"
                        color="#fafafa"
                        style={styles.loader}
                    />
                )}
                {!error ? (
                    <Animated.Image
                        key={retryKey}
                        source={{ uri: 'https://i.imgur.com/t3WOlrJ.jpeg' }}
                        style={[styles.image, animatedStyle]}
                        onLoadStart={handleLoadStart}
                        onLoadEnd={handleLoadEnd}
                        onError={handleError}
                        fadeDuration={0}
                    />
                ) : (
                    <View style={styles.retryContainer}>
                        <Text style={styles.retryText}>Failed to load image.</Text>
                        <TouchableOpacity onPress={handleRetry}>
                            <Text style={styles.retryText}>Tap to retry</Text>
                        </TouchableOpacity>
                    </View>
                )}
                {bboxForBox && (
                    <Animated.View
                        style={[StyleSheet.absoluteFill, animatedStyle, styles.svg]}
                        pointerEvents="none"
                    >
                        <Svg
                            style={[StyleSheet.absoluteFill, styles.svg]}
                            pointerEvents="none"
                        >
                            <Rect
                                x={bboxForBox.x}
                                y={bboxForBox.y}
                                width={bboxForBox.width}
                                height={bboxForBox.height}
                                stroke="#f00"
                                strokeWidth={2}
                                fill="#fff"
                                fillOpacity="0.1"
                            />
                        </Svg>
                    </Animated.View>
                )}
            </View>
        </GestureDetector>
    );
}
