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

import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import Box from '@/components/ui/Box';
import EmptyState from '@/components/ui/EmptyState';
import Positioned from '@/components/ui/Positioned';
import Spinner from '@/components/ui/Spinner';
import { BORDER_WIDTH_MD } from '@/constants/border';

// expo-image (memory+disk cache, fast decode) wrapped so the pinch-zoom
// transform can animate it via reanimated.
const AnimatedImage = Animated.createAnimatedComponent(ExpoImage);

/**
 * Spanning the parent is the one extent no size token can express, and RN only accepts it as
 * a percentage string. It is stated here, inside the animated style, rather than on a ui/ box
 * around the node: the two nodes it sizes are third-party ones an outer primitive cannot
 * reach, see the note on `pinchStyle`.
 */
const FULL_EXTENT = '100%';

/**
 * Paint for the shape outline drawn over the image. Neither colour is a theme token and
 * neither wants to be: the rect is drawn on satellite imagery, so it reads the same under both
 * themes, and an SVG paint attribute is not a style a ui/ primitive can supply.
 */
const SHAPE_STROKE_COLOR = '#f00';
const SHAPE_FILL_COLOR = '#fff';
// A wash, not a fill: the shape has to be visible without hiding the imagery it marks.
const SHAPE_FILL_OPACITY = '0.1';

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
    bbox: number[] | undefined,
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
    bbox: number[] | undefined;
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
    // Once the image has loaded, a later (cache-served) reload must not re-show
    // the spinner — its onLoadEnd often doesn't re-fire, leaving it stuck.
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

        // expo-image's load event carries the natural dimensions, so we no
        // longer need a separate Image.getSize() fetch for the bbox math.
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

    /**
     * The one style this file keeps, and the reason it is the sanctioned adapter: a shared
     * value read on the UI thread can never be a variant prop.
     *
     * It carries its own box as well as the transform, deliberately. The two nodes it drives
     * are third-party ones — an animated expo-image and an Animated.View — that no ui/
     * primitive can size from outside: a Positioned around a node with no extent of its own
     * lays out to nothing. Both nodes span their parent, so one style serves both, and the
     * overlay is guaranteed to track the image rather than drift by a rounding of its own.
     */
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
                {/*
                  RNGH clones its child with `collapsable: false` so the detector can find a
                  native view to attach to, and ui/Box would drop that prop. This node keeps
                  itself in the hierarchy without it: `layer` puts a zIndex on a positioned
                  box, and Fabric never flattens a view that forms a stacking context. It
                  fills the Box above, so the touch area is the container's, unchanged.
                */}
                <Positioned
                    anchor="fill"
                    layer="base"
                    align="center"
                    justify="center"
                >
                    {loading && (
                        <Positioned
                            anchor="fill"
                            layer="chrome"
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
                            // No fade, matching the previous Image's fadeDuration={0}
                            // — keeps the loading behaviour identical.
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
                                {/* No width/height: react-native-svg defaults an unsized Svg
                                    to 100% of its parent on both axes. */}
                                <Svg pointerEvents="none">
                                    <Rect
                                        x={bboxForBox.x}
                                        y={bboxForBox.y}
                                        width={bboxForBox.width}
                                        height={bboxForBox.height}
                                        stroke={SHAPE_STROKE_COLOR}
                                        strokeWidth={BORDER_WIDTH_MD}
                                        fill={SHAPE_FILL_COLOR}
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
