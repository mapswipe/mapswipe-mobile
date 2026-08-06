import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { type LayoutChangeEvent } from 'react-native';
import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';
import {
    Image as ExpoImage,
    type ImageLoadEventData,
} from 'expo-image';

import Box from '@/components/ui/Box';
import EmptyState from '@/components/ui/EmptyState';
import HideTileSelectionButton from '@/components/ui/HideTileSelectionButton';
import Positioned from '@/components/ui/Positioned';
import Spinner from '@/components/ui/Spinner';
import { BORDER_WIDTH_MD } from '@/constants/border';
import useTheme from '@/hooks/useTheme';
import projectBbox from '@/utils/imageBbox';

const AnimatedImage = Animated.createAnimatedComponent(ExpoImage);

// RN only accepts a parent-spanning extent as a percentage string.
const FULL_EXTENT = '100%';

// A wash, not a fill: the shape must stay visible without hiding the imagery.
const SHAPE_FILL_OPACITY = '0.1';

interface ImageDimensions {
    clientHeight?: number;
    clientWidth?: number;
    naturalHeight?: number;
    naturalWidth?: number;
}

interface ImageWrapperProps {
    style?: never;
    item: { url: string };
    itemIndex: number;
    onImageLoadStart: (itemKey: number) => void;
    onImageLoadEnd: (itemKey: number) => void;
    bbox: number[] | undefined;
}

export default function ImageWrapper({
    item,
    itemIndex,
    onImageLoadStart,
    onImageLoadEnd,
    bbox,
}: ImageWrapperProps) {
    const theme = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [imageDimensions, setImageDimensions] = useState<ImageDimensions>();
    // A cache-served reload often skips onLoadEnd, so a re-shown spinner would stick.
    const loadedRef = useRef(false);

    // Stable source so parent re-renders don't trigger a spurious reload.
    const source = useMemo(() => ({ uri: item.url }), [item.url]);

    useEffect(() => {
        onImageLoadStart(itemIndex);
    }, [onImageLoadStart, itemIndex]);

    const handleLoadStart = useCallback(() => {
        if (loadedRef.current) {
            return;
        }
        onImageLoadStart(itemIndex);
        setLoading(true);
    }, [onImageLoadStart, itemIndex]);

    const handleLoad = useCallback((event: ImageLoadEventData) => {
        loadedRef.current = true;
        setLoading(false);
        onImageLoadEnd(itemIndex);

        const { width, height } = event.source;
        if (width && height) {
            setImageDimensions((prev) => ({
                ...prev,
                naturalWidth: width,
                naturalHeight: height,
            }));
        }
    }, [onImageLoadEnd, itemIndex]);

    const handleError = useCallback(() => {
        setLoading(false);
        setError(true);
    }, []);

    const handleRetry = useCallback(() => {
        loadedRef.current = false;
        setLoading(true);
        setError(false);
        setRetryKey((k) => k + 1);
    }, []);

    const handleLoadEnd = useCallback(() => {
        loadedRef.current = true;
        onImageLoadEnd(itemIndex);
        setLoading(false);
    }, [onImageLoadEnd, itemIndex]);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setImageDimensions((prev) => ({
            ...prev,
            clientWidth: width,
            clientHeight: height,
        }));
    }, []);

    const bboxForBox = imageDimensions === undefined
        ? undefined
        : projectBbox({
            naturalWidth: imageDimensions.naturalWidth ?? 0,
            naturalHeight: imageDimensions.naturalHeight ?? 0,
            clientWidth: imageDimensions.clientWidth ?? 0,
            clientHeight: imageDimensions.clientHeight ?? 0,
        }, bbox);

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

    // Both animated nodes take this one style, so the overlay cannot drift from the image.
    const pinchStyle = useAnimatedStyle(() => ({
        width: FULL_EXTENT,
        height: FULL_EXTENT,
        transform: [
            { translateX: -focalX.value },
            { translateY: -focalY.value },
            { scale: scale.value },
            { translateX: focalX.value },
            { translateY: focalY.value },
        ],
    }));

    const [hideShapeSource, setHideShapeSourceValue] = useState(false);
    const handleHideTilePressIn = useCallback(() => {
        setHideShapeSourceValue(true);
    }, []);

    const handleHideTilePressOut = useCallback(() => {
        setHideShapeSourceValue(false);
    }, []);

    return (
        <Box
            flex={2}
            selfAlign="stretch"
            onLayout={handleLayout}
        >
            <GestureDetector gesture={pinchGesture}>
                {/* RNGH needs an unflattened native child, and ui/Box drops its
                    `collapsable: false`. `layer` sets a zIndex, which Fabric never flattens. */}
                <Positioned
                    anchor="fill"
                    layer="base"
                    align="center"
                    justify="center"
                >
                    {loading && (
                        <Positioned
                            anchor="fill"
                            layer="controls"
                            align="center"
                            justify="center"
                            pointerEvents="none"
                        >
                            <Spinner
                                colorVariant="onBrand"
                                accessibilityLabel="Loading image"
                            />
                        </Positioned>
                    )}
                    {!error ? (
                        <AnimatedImage
                            key={retryKey}
                            source={source}
                            style={pinchStyle}
                            contentFit="contain"
                            cachePolicy="memory-disk"
                            transition={0}
                            onLoadStart={handleLoadStart}
                            onLoad={handleLoad}
                            onLoadEnd={handleLoadEnd}
                            onError={handleError}
                        />
                    ) : (
                        <EmptyState
                            sizeVariant="inline"
                            colorVariant="onBrand"
                            title="Failed to load image."
                            actionLabel="Tap to retry"
                            actionAccessibilityLabel="Retry loading the image"
                            onActionPress={handleRetry}
                        />
                    )}
                    {!error && bboxForBox && !hideShapeSource && (
                        <Positioned
                            anchor="fill"
                            layer="overlay"
                            pointerEvents="none"
                        >
                            <Animated.View style={pinchStyle}>
                                {/* No width/height: react-native-svg then fills its parent. */}
                                <Svg pointerEvents="none">
                                    <Rect
                                        x={bboxForBox.x}
                                        y={bboxForBox.y}
                                        width={bboxForBox.width}
                                        height={bboxForBox.height}
                                        stroke={theme.negative}
                                        strokeWidth={BORDER_WIDTH_MD}
                                        fill={theme.textOnPrimary}
                                        fillOpacity={SHAPE_FILL_OPACITY}
                                    />
                                </Svg>
                            </Animated.View>
                        </Positioned>
                    )}
                    {!error && (
                        <Positioned
                            anchor="bottom"
                            align="center"
                        >
                            <HideTileSelectionButton
                                handleHideTileSelectionPressIn={handleHideTilePressIn}
                                handleHideTileSelectionPressOut={handleHideTilePressOut}
                                size="large"
                            />
                        </Positioned>
                    )}
                </Positioned>
            </GestureDetector>
        </Box>
    );
}
