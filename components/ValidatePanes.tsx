import {
    useCallback,
    useState,
} from 'react';
import {
    type LayoutChangeEvent,
    StyleSheet,
    View,
} from 'react-native';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import BlockListView from '@/components/BlockListView';
import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import MapTile from '@/components/MapTile';
import MapZoomButtons from '@/components/MapZoomButtons';
import ScaleBar from '@/components/ScaleBar';
import Text from '@/components/Text';
import {
    getBbox,
    getFitZoomLevel,
    getScaleBarZoomLevel,
    MAP_MAX_ZOOM_LEVEL,
    MAP_MIN_ZOOM_LEVEL,
    SCALE_BAR_REFERENCE_SIZE,
} from '@/utils/geo';
import {
    type FbObjRasterTileServer,
    type FeatureGeoJson,
} from '@/utils/types';

const PANE_GAP = 8;
const MAX_PANE_HEIGHT_RATIO = 3 / 4;
// Small features start at this zoom instead of filling the pane, so their
// surroundings stay visible. The zoom buttons can still go further in.
const MAX_START_ZOOM_LEVEL = 18;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        gap: PANE_GAP,
    },
    pane: {
        width: '100%',
        position: 'relative',
    },
    mapTile: {
        flex: 1,
    },
    topLeftOverlay: {
        position: 'absolute',
        top: 8,
        left: 8,
        gap: 4,
    },
    label: {
        alignSelf: 'flex-start',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: '#ffffff',
        fontSize: 12,
    },
    controlsOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    eyeButton: {},
    creditsOverlay: {
        position: 'absolute',
        bottom: 8,
        left: 8,
    },
    creditsOverlayBesideControls: {
        right: 56,
    },
    creditsOverlayFull: {
        right: 8,
    },
    credits: {
        alignSelf: 'flex-start',
        paddingHorizontal: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: '#ffffff',
        fontSize: 10,
    },
});

export interface Pane {
    tileServer: FbObjRasterTileServer;
    label?: string;
}

interface Props {
    geoJson: FeatureGeoJson;
    panes: Pane[];
    zoomOffset: number;
    onZoomOffsetChange: (zoomOffset: number) => void;
    hideLines: boolean;
    onHideLinesChange: (hideLines: boolean) => void;
}

function ValidatePanes(props: Props) {
    const {
        geoJson,
        panes,
        zoomOffset,
        onZoomOffsetChange,
        hideLines,
        onHideLinesChange,
    } = props;

    const [size, setSize] = useState<{ width: number, height: number }>();

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
    }, []);

    const handleHideLinesPressIn = useCallback(() => {
        onHideLinesChange(true);
    }, [onHideLinesChange]);

    const handleHideLinesPressOut = useCallback(() => {
        onHideLinesChange(false);
    }, [onHideLinesChange]);

    const isBeforeAfter = panes.length > 1;
    const paneWidth = size?.width ?? 0;
    let paneHeight = 0;
    if (isDefined(size)) {
        paneHeight = isBeforeAfter
            ? Math.min(
                (size.height - PANE_GAP * (panes.length - 1)) / panes.length,
                size.width * MAX_PANE_HEIGHT_RATIO,
            )
            : size.height;
    }

    const bbox = getBbox(geoJson);
    const latitude = isDefined(bbox) ? (bbox[1] + bbox[3]) / 2 : undefined;
    const fitZoom = isDefined(bbox) && paneWidth > 0 && paneHeight > 0
        ? getFitZoomLevel(bbox, paneWidth, paneHeight, undefined, MAX_START_ZOOM_LEVEL)
        : undefined;
    const zoom = isDefined(fitZoom) ? fitZoom + zoomOffset : undefined;

    const handleZoomIn = useCallback(() => {
        if (isDefined(fitZoom)) {
            onZoomOffsetChange(Math.min(zoomOffset + 1, MAP_MAX_ZOOM_LEVEL - fitZoom));
        }
    }, [fitZoom, zoomOffset, onZoomOffsetChange]);

    const handleZoomOut = useCallback(() => {
        if (isDefined(fitZoom)) {
            onZoomOffsetChange(Math.max(zoomOffset - 1, MAP_MIN_ZOOM_LEVEL - fitZoom));
        }
    }, [fitZoom, zoomOffset, onZoomOffsetChange]);

    return (
        <View style={styles.container} onLayout={handleLayout}>
            {paneHeight > 0 && panes.map((pane, paneIndex) => {
                const isFirst = paneIndex === 0;
                const isLast = paneIndex === panes.length - 1;
                return (
                    <View
                        // eslint-disable-next-line react/no-array-index-key
                        key={paneIndex}
                        style={[styles.pane, { height: paneHeight }]}
                    >
                        <MapTile
                            geoJson={geoJson}
                            tileServer={pane.tileServer}
                            hideLines={hideLines}
                            zoomLevel={zoom}
                            style={styles.mapTile}
                        />
                        <View style={styles.topLeftOverlay} pointerEvents="none">
                            {isDefined(pane.label) && (
                                <Text style={styles.label}>
                                    {pane.label}
                                </Text>
                            )}
                            {isFirst && isDefined(latitude) && isDefined(zoom) && (
                                <ScaleBar
                                    latitude={latitude}
                                    referenceSize={SCALE_BAR_REFERENCE_SIZE}
                                    tileSize={paneWidth}
                                    zoomLevel={getScaleBarZoomLevel(zoom)}
                                    inline
                                />
                            )}
                        </View>
                        {isDefined(pane.tileServer.credits) && (
                            <View
                                style={[
                                    styles.creditsOverlay,
                                    isLast
                                        ? styles.creditsOverlayBesideControls
                                        : styles.creditsOverlayFull,
                                ]}
                                pointerEvents="none"
                            >
                                <Text
                                    style={styles.credits}
                                    numberOfLines={1}
                                    ellipsizeMode="tail"
                                >
                                    {pane.tileServer.credits}
                                </Text>
                            </View>
                        )}
                        {isLast && (
                            <BlockListView spacing="xs" style={styles.controlsOverlay}>
                                <MapZoomButtons
                                    onZoomIn={handleZoomIn}
                                    onZoomOut={handleZoomOut}
                                    zoomInDisabled={
                                        isNotDefined(zoom) || zoom >= MAP_MAX_ZOOM_LEVEL
                                    }
                                    zoomOutDisabled={
                                        isNotDefined(zoom) || zoom <= MAP_MIN_ZOOM_LEVEL
                                    }
                                />
                                <HideTileSelectionButton
                                    handleHideTileSelectionPressIn={handleHideLinesPressIn}
                                    handleHideTileSelectionPressOut={handleHideLinesPressOut}
                                    isPressed={hideLines}
                                    containerStyle={styles.eyeButton}
                                />
                            </BlockListView>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

export default ValidatePanes;
