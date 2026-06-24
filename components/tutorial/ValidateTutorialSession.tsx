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
    SPACING_XS,
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
        gap: SPACING_XS,
    },
    // The map fills the leftover space between the title and the answer buttons.
    // Use flex:1 (basis 0), NOT flexGrow:1 — RN defaults flexShrink to 0, so a
    // flexGrow-only map keeps its large content basis and pushes the shrink-0
    // answer buttons off the slot (under the Check Answer button). overflow
    // clips the map to its allotted area.
    tile: {
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
    },
    loading: {
        flex: 1,
        minHeight: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttons: {
        flexShrink: 0,
        paddingVertical: SPACING_3XS,
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
            <View style={styles.tile}>
                {geoJson ? (
                    <MapTile
                        geoJson={geoJson}
                        tileServer={tutorial.tileServer}
                        hideLines={hideTilePressValue}
                    />
                ) : (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" />
                    </View>
                )}
            </View>
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
    );
}

export default ValidateTutorialSession;
