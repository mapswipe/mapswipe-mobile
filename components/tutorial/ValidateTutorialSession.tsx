import { useCallback } from 'react';
import { StyleSheet } from 'react-native';

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
        padding: SPACING_2XS,
        gap: SPACING_XS,
    },
    tile: {
        flexGrow: 1,
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
    const selectedValue = results[task.taskId];

    return (
        <InlineListView style={styles.container} spacing="md" withoutWrap={false}>
            {geoJson && (
                <MapTile
                    geoJson={geoJson}
                    tileServer={tutorial.tileServer}
                />
            )}
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
                        active={selectedValue === option.value}
                        disabled={disabled}
                        textColorVariant="brand"
                        onPress={(value) => handleSelect(task.taskId, value)}
                    />
                ))}
            </InlineListView>
        </InlineListView>
    );
}

export default ValidateTutorialSession;
