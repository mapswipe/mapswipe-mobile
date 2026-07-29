import {
    useCallback,
    useState,
} from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';
import { isDefined } from '@togglecorp/fujs';

import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import { type IconName } from '@/components/Icon';
import IconButton from '@/components/IconButton';
import InlineListView from '@/components/InlineListView';
import MapTile from '@/components/MapTile';
import ScaleBar from '@/components/ScaleBar';
import { TutorialSessionProps } from '@/components/tutorial/types';
import {
    SPACING_2XS,
    SPACING_3XS,
} from '@/constants/dimensions';
import {
    getBbox,
    getOptimalZoomLevel,
} from '@/utils/geo';
import { getTutorialTaskKey } from '@/utils/tutorial';
import {
    FeatureGeoJson,
    PROJECT_TYPE_VALIDATE,
} from '@/utils/types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 0,
        padding: SPACING_2XS,
    },
    // The map gets its own flex slot: flex reserves the controls (flexShrink:0)
    // and gives the rest here, and overflow:hidden means the map can never push
    // the answer buttons off-screen even if its measured height is briefly off.
    mapSlot: {
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Overlays on the map, with a small padding.
    scaleOverlay: {
        position: 'absolute',
        top: 8,
        left: 8,
    },
    eyeOverlay: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    eyeButton: {},
    controls: {
        flexShrink: 0,
        paddingTop: SPACING_3XS,
    },
    buttons: {
        flexShrink: 0,
        paddingTop: SPACING_3XS,
    },
});

function ValidateTutorialSession(props: TutorialSessionProps) {
    const {
        tutorial,
        tasks,
        results,
        onResultsChange,
        disabled,
    } = props;

    const [hideTilePressValue, setHideTilePressValue] = useState(false);
    // MapLibre's MapView ignores a flex height, so we measure the (flex-sized)
    // map slot and pass that as an explicit pixel size to MapTile / the scale bar.
    const [mapSlotSize, setMapSlotSize] = useState({ width: 0, height: 0 });

    const handleSelect = useCallback((taskId: string, value: number) => {
        if (disabled) {
            return;
        }
        onResultsChange((prev) => ({
            ...prev,
            [taskId]: value,
        }));
    }, [disabled, onResultsChange]);

    const handleHideTilePressIn = useCallback(() => {
        setHideTilePressValue(true);
    }, []);

    const handleHideTilePressOut = useCallback(() => {
        setHideTilePressValue(false);
    }, []);

    if (tutorial.projectType !== PROJECT_TYPE_VALIDATE) {
        return null;
    }

    const { customOptions } = tutorial;
    const task = tasks[0];

    if (!task) {
        return null;
    }

    const geoJson = 'geojson' in task ? task.geojson as FeatureGeoJson : undefined;
    const selectedValue = results[getTutorialTaskKey(task)];

    // Scale-bar geometry, derived from the task's geojson the same way MapTile
    // frames it (optimal zoom for the bbox).
    const bbox = geoJson ? getBbox(geoJson) : undefined;
    const latitude = bbox ? (bbox[1] + bbox[3]) / 2 : undefined;
    const zoomLevel = bbox ? getOptimalZoomLevel(bbox) : undefined;

    return (
        <View style={styles.container}>
            <View
                style={styles.mapSlot}
                onLayout={(event) => setMapSlotSize({
                    width: event.nativeEvent.layout.width,
                    height: event.nativeEvent.layout.height,
                })}
            >
                {geoJson ? (
                    <MapTile
                        geoJson={geoJson}
                        tileServer={tutorial.tileServer}
                        hideLines={hideTilePressValue}
                        style={[styles.map, { height: mapSlotSize.height || undefined }]}
                    />
                ) : (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" />
                    </View>
                )}
                {geoJson && isDefined(latitude)
                && isDefined(zoomLevel) && mapSlotSize.width > 0 && (
                    <View style={styles.scaleOverlay} pointerEvents="none">
                        <ScaleBar
                            latitude={latitude}
                            referenceSize={mapSlotSize.width}
                            tileSize={mapSlotSize.width}
                            zoomLevel={zoomLevel}
                            inline
                        />
                    </View>
                )}
                {geoJson && (
                    <View style={styles.eyeOverlay}>
                        <HideTileSelectionButton
                            handleHideTileSelectionPressIn={handleHideTilePressIn}
                            handleHideTileSelectionPressOut={handleHideTilePressOut}
                            isPressed={hideTilePressValue}
                            containerStyle={styles.eyeButton}
                        />
                    </View>
                )}
            </View>
            <View style={styles.controls}>
                <InlineListView
                    withCenteredContent
                    style={styles.buttons}
                    spacing="sm"
                >
                    {customOptions?.map((option) => (
                        <IconButton
                            key={option.value}
                            name={option.value}
                            title={option.title}
                            iconName={option.icon as IconName}
                            tintColor={option.iconColor}
                            width={50}
                            active={selectedValue === option.value}
                            disabled={disabled}
                            textColorVariant="brand"
                            onPress={(value) => handleSelect(getTutorialTaskKey(task), value)}
                        />
                    ))}
                </InlineListView>
            </View>
        </View>
    );
}

export default ValidateTutorialSession;
