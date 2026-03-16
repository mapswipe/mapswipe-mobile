import {
    useCallback,
    useEffect,
    useRef,
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
    PinchGestureHandler,
    PinchGestureHandlerGestureEvent,
    PinchGestureHandlerStateChangeEvent,
    State,
} from 'react-native-gesture-handler';
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
    const [scale, setScale] = useState(1);
    const [focalX, setFocalX] = useState(0);
    const [focalY, setFocalY] = useState(0);

    const baseScale = useRef(1);
    const lastFocalX = useRef<number | null>(null);
    const lastFocalY = useRef<number | null>(null);

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

    const handlePinch = useCallback(
        (event: PinchGestureHandlerGestureEvent) => {
            const { scale: gestureScale, focalX: gFocalX, focalY: gFocalY } = event.nativeEvent;

            const newScale = baseScale.current * gestureScale;
            const deltaX = lastFocalX.current != null ? gFocalX - lastFocalX.current : 0;
            const deltaY = lastFocalY.current != null ? gFocalY - lastFocalY.current : 0;

            lastFocalX.current = gFocalX;
            lastFocalY.current = gFocalY;

            setScale(newScale);
            setFocalX((prev) => prev + deltaX);
            setFocalY((prev) => prev + deltaY);
        },
        [],
    );

    const onPinchStateChange = useCallback(
        (event: PinchGestureHandlerStateChangeEvent) => {
            const { state } = event.nativeEvent;

            if (state === State.BEGAN) {
                baseScale.current = scale;
                lastFocalX.current = null;
                lastFocalY.current = null;
            }

            if (state === State.END || state === State.CANCELLED) {
                baseScale.current = 1;
                lastFocalX.current = null;
                lastFocalY.current = null;
                setScale(1);
                setFocalX(0);
                setFocalY(0);
            }
        },
        [scale],
    );

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setImageDimensions((prev) => ({
            ...prev,
            clientWidth: width,
            clientHeight: height,
        }));
    }, []);

    const bboxForBox = calculateBbox(imageDimensions, bbox);

    const transform = [
        { translateX: -focalX },
        { translateY: -focalY },
        { scale },
        { translateX: focalX },
        { translateY: focalY },
    ] as const;

    return (
        <PinchGestureHandler
            onGestureEvent={handlePinch}
            onHandlerStateChange={onPinchStateChange}
        >
            <View onLayout={handleLayout} style={styles.container}>
                {loading && (
                    <ActivityIndicator
                        size="large"
                        color="#fafafa"
                        style={styles.loader}
                    />
                )}
                {!error ? (
                    <Image
                        key={retryKey}
                        source={{ uri: 'https://i.imgur.com/t3WOlrJ.jpeg' }}
                        style={[styles.image, { transform }]}
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
                    <Svg
                        style={[StyleSheet.absoluteFill, { transform }, styles.svg]}
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
                )}
            </View>
        </PinchGestureHandler>
    );
}
