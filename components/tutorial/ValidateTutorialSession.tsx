import {
    useCallback,
    useState,
} from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';

import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import { type IconName } from '@/components/Icon';
import IconButton from '@/components/IconButton';
import InlineListView from '@/components/InlineListView';
import MapTile from '@/components/MapTile';
import { TutorialSessionProps } from '@/components/tutorial/types';
import {
    SPACING_2XS,
    SPACING_3XS,
} from '@/constants/dimensions';
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
    // map slot and pass that as an explicit pixel height to MapTile.
    const [mapSlotHeight, setMapSlotHeight] = useState(0);

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
    const selectedValue = results[task.taskId];

    return (
        <View style={styles.container}>
            <View
                style={styles.mapSlot}
                onLayout={(event) => setMapSlotHeight(event.nativeEvent.layout.height)}
            >
                {geoJson ? (
                    <MapTile
                        geoJson={geoJson}
                        tileServer={tutorial.tileServer}
                        hideLines={hideTilePressValue}
                        style={[styles.map, { height: mapSlotHeight || undefined }]}
                    />
                ) : (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" />
                    </View>
                )}
            </View>
            <View style={styles.controls}>
                <HideTileSelectionButton
                    handleHideTileSelectionPressIn={handleHideTilePressIn}
                    handleHideTileSelectionPressOut={handleHideTilePressOut}
                    isPressed={hideTilePressValue}
                />
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
                            onPress={(value) => handleSelect(task.taskId, value)}
                        />
                    ))}
                </InlineListView>
            </View>
        </View>
    );
}

export default ValidateTutorialSession;
