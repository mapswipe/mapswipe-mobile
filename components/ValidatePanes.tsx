import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
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
    FONT_SIZE_2XS,
    FONT_SIZE_XS,
    SPACING_3XS,
    SPACING_4XS,
} from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
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

const PANE_GAP = SPACING_3XS;
const MAX_PANE_HEIGHT_RATIO = 3 / 4;
// Room kept free for the zoom buttons next to the credits
const CONTROLS_RESERVED_WIDTH = 56;

const createStyles = (theme: AppTheme) => StyleSheet.create({
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
        top: SPACING_3XS,
        left: SPACING_3XS,
        gap: SPACING_4XS,
    },
    label: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING_4XS,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: theme.overlay,
        color: theme.textOnPrimary,
        fontSize: FONT_SIZE_XS,
    },
    controlsOverlay: {
        position: 'absolute',
        bottom: SPACING_3XS,
        right: SPACING_3XS,
    },
    eyeButton: {},
    creditsOverlay: {
        position: 'absolute',
        bottom: SPACING_3XS,
        left: SPACING_3XS,
    },
    creditsOverlayBesideControls: {
        right: CONTROLS_RESERVED_WIDTH,
    },
    creditsOverlayFull: {
        right: SPACING_3XS,
    },
    credits: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING_4XS,
        borderRadius: 2,
        backgroundColor: theme.overlay,
        color: theme.textOnPrimary,
        fontSize: FONT_SIZE_2XS,
    },
});

interface PaneProps {
    geoJson: FeatureGeoJson;
    tileServer: FbObjRasterTileServer;
    label?: string;
    width: number;
    height: number;
    zoom: number | undefined;
    latitude: number | undefined;
    hideLines: boolean;
    showScaleBar: boolean;
    controls?: React.ReactNode;
}

function ValidatePane(props: PaneProps) {
    const {
        geoJson,
        tileServer,
        label,
        width,
        height,
        zoom,
        latitude,
        hideLines,
        showScaleBar,
        controls,
    } = props;

    const styles = useThemedStyles(createStyles);

    return (
        <View style={[styles.pane, { height }]}>
            <MapTile
                geoJson={geoJson}
                tileServer={tileServer}
                hideLines={hideLines}
                zoomLevel={zoom}
                style={styles.mapTile}
            />
            <View style={styles.topLeftOverlay} pointerEvents="none">
                {isDefined(label) && (
                    <Text style={styles.label}>
                        {label}
                    </Text>
                )}
                {showScaleBar && isDefined(latitude) && isDefined(zoom) && (
                    <ScaleBar
                        latitude={latitude}
                        referenceSize={SCALE_BAR_REFERENCE_SIZE}
                        tileSize={width}
                        zoomLevel={getScaleBarZoomLevel(zoom)}
                        inline
                    />
                )}
            </View>
            {isDefined(tileServer.credits) && (
                <View
                    style={[
                        styles.creditsOverlay,
                        isDefined(controls)
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
                        {tileServer.credits}
                    </Text>
                </View>
            )}
            {isDefined(controls) && (
                <BlockListView spacing="xs" style={styles.controlsOverlay}>
                    {controls}
                </BlockListView>
            )}
        </View>
    );
}

interface Props {
    geoJson: FeatureGeoJson;
    tileServer: FbObjRasterTileServer;
    preEventTileServer?: FbObjRasterTileServer;
    zoomOffset: number;
    onZoomOffsetChange: (zoomOffset: number) => void;
    hideLines: boolean;
    onHideLinesChange: (hideLines: boolean) => void;
}

function ValidatePanes(props: Props) {
    const {
        geoJson,
        tileServer,
        preEventTileServer,
        zoomOffset,
        onZoomOffsetChange,
        hideLines,
        onHideLinesChange,
    } = props;

    const { t } = useTranslation('mappingSession');
    const styles = useThemedStyles(createStyles);

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

    const hasPreEvent = isDefined(preEventTileServer);
    const paneWidth = size?.width ?? 0;
    let paneHeight = 0;
    if (isDefined(size)) {
        paneHeight = hasPreEvent
            ? Math.min(
                (size.height - PANE_GAP) / 2,
                size.width * MAX_PANE_HEIGHT_RATIO,
            )
            : size.height;
    }

    const bbox = getBbox(geoJson);
    const latitude = isDefined(bbox) ? (bbox[1] + bbox[3]) / 2 : undefined;
    const fitZoom = isDefined(bbox) && paneWidth > 0 && paneHeight > 0
        ? getFitZoomLevel(bbox, paneWidth, paneHeight)
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

    const controls = (
        <>
            <MapZoomButtons
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                zoomInDisabled={isNotDefined(zoom) || zoom >= MAP_MAX_ZOOM_LEVEL}
                zoomOutDisabled={isNotDefined(zoom) || zoom <= MAP_MIN_ZOOM_LEVEL}
            />
            <HideTileSelectionButton
                handleHideTileSelectionPressIn={handleHideLinesPressIn}
                handleHideTileSelectionPressOut={handleHideLinesPressOut}
                isPressed={hideLines}
                containerStyle={styles.eyeButton}
            />
        </>
    );

    return (
        <View style={styles.container} onLayout={handleLayout}>
            {paneHeight > 0 && (
                <>
                    {isDefined(preEventTileServer) && (
                        <ValidatePane
                            geoJson={geoJson}
                            tileServer={preEventTileServer}
                            label={t('validateBefore')}
                            width={paneWidth}
                            height={paneHeight}
                            zoom={zoom}
                            latitude={latitude}
                            hideLines={hideLines}
                            showScaleBar
                        />
                    )}
                    <ValidatePane
                        geoJson={geoJson}
                        tileServer={tileServer}
                        label={hasPreEvent ? t('validateAfter') : undefined}
                        width={paneWidth}
                        height={paneHeight}
                        zoom={zoom}
                        latitude={latitude}
                        hideLines={hideLines}
                        showScaleBar={!hasPreEvent}
                        controls={controls}
                    />
                </>
            )}
        </View>
    );
}

export default ValidatePanes;
