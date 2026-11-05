import {
    useCallback,
    useState,
} from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';

import { type IconName } from '@/components/Icon';
import IconButton from '@/components/IconButton';
import InlineListView from '@/components/InlineListView';
import { TutorialSessionProps } from '@/components/tutorial/types';
import ValidatePanes from '@/components/ValidatePanes';
import {
    SPACING_2XS,
    SPACING_3XS,
} from '@/constants/dimensions';
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
    const [taskZoom, setTaskZoom] = useState<{ taskKey: string, offset: number }>();

    const handleSelect = useCallback((taskId: string, value: number) => {
        if (disabled) {
            return;
        }
        onResultsChange((prev) => ({
            ...prev,
            [taskId]: value,
        }));
    }, [disabled, onResultsChange]);

    if (tutorial.projectType !== PROJECT_TYPE_VALIDATE) {
        return null;
    }

    const { customOptions } = tutorial;
    const task = tasks[0];

    if (!task) {
        return null;
    }

    const geoJson = 'geojson' in task ? task.geojson as FeatureGeoJson : undefined;
    const taskKey = getTutorialTaskKey(task);
    const selectedValue = results[taskKey];
    const zoomOffset = taskZoom?.taskKey === taskKey ? taskZoom.offset : 0;

    return (
        <View style={styles.container}>
            <View style={styles.mapSlot}>
                {geoJson ? (
                    <ValidatePanes
                        geoJson={geoJson}
                        tileServer={tutorial.postEventTileServer ?? tutorial.tileServer}
                        preEventTileServer={tutorial.preEventTileServer}
                        zoomOffset={zoomOffset}
                        onZoomOffsetChange={(offset) => setTaskZoom({ taskKey, offset })}
                        hideLines={hideTilePressValue}
                        onHideLinesChange={setHideTilePressValue}
                    />
                ) : (
                    <View style={styles.loading}>
                        <ActivityIndicator size="large" />
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
