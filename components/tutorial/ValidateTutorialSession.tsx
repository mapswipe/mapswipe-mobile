import {
    useCallback,
    useState,
} from 'react';
import { isDefined } from '@togglecorp/fujs';

import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import MapTile from '@/components/MapTile';
import ScaleBar from '@/components/ScaleBar';
import { TutorialSessionProps } from '@/components/tutorial/types';
import Box from '@/components/ui/Box';
import { type IconName } from '@/components/ui/Icon';
import IconButton from '@/components/ui/IconButton';
import Positioned from '@/components/ui/Positioned';
import Row from '@/components/ui/Row';
import Spinner from '@/components/ui/Spinner';
import Stack from '@/components/ui/Stack';
import {
    getBbox,
    getOptimalZoomLevel,
} from '@/utils/geo';
import { getTutorialTaskKey } from '@/utils/tutorial';
import {
    FeatureGeoJson,
    PROJECT_TYPE_VALIDATE,
} from '@/utils/types';

function ValidateTutorialSession(props: TutorialSessionProps) {
    const {
        tutorial,
        tasks,
        results,
        onResultsChange,
        disabled,
    } = props;

    const [hideTilePressValue, setHideTilePressValue] = useState(false);
    // MapLibre's MapView ignores a flex height, so we measure the (flex-sized) map slot and
    // hand that back as an explicit block extent. The width is what the scale bar draws its
    // metres against, so it is measured rather than divided out of the window.
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
        <Stack
            spacing="xs"
            padding="2xs"
            grow="slot"
        >
            {/* The map gets its own slot: `slot` reserves the answer bar's content height and
                gives the rest here, and clipping means the map can never push the buttons
                off-screen even if its measured height is briefly off. */}
            <Box
                flex={1}
                minHeight={0}
                clip
                onLayout={(event) => setMapSlotSize({
                    width: event.nativeEvent.layout.width,
                    height: event.nativeEvent.layout.height,
                })}
            >
                {geoJson ? (
                    <Box height={mapSlotSize.height || undefined}>
                        <MapTile
                            geoJson={geoJson}
                            tileServer={tutorial.tileServer}
                            hideLines={hideTilePressValue}
                        />
                    </Box>
                ) : (
                    <Box
                        flex={1}
                        align="center"
                        justify="center"
                    >
                        <Spinner
                            colorVariant="onBrand"
                            accessibilityLabel="Loading task"
                        />
                    </Box>
                )}
                {geoJson && isDefined(latitude)
                && isDefined(zoomLevel) && mapSlotSize.width > 0 && (
                    <Positioned
                        anchor="topStart"
                        offset="3xs"
                        pointerEvents="none"
                    >
                        <ScaleBar
                            latitude={latitude}
                            referenceSize={mapSlotSize.width}
                            tileSize={mapSlotSize.width}
                            zoomLevel={zoomLevel}
                            inline
                        />
                    </Positioned>
                )}
                {geoJson && (
                    <Positioned
                        anchor="bottomEnd"
                        offset="3xs"
                    >
                        <HideTileSelectionButton
                            handleHideTileSelectionPressIn={handleHideTilePressIn}
                            handleHideTileSelectionPressOut={handleHideTilePressOut}
                            // Positioned already places this in the map's corner, so the
                            // button's own container padding would shift it inwards.
                            withoutContainer
                        />
                    </Positioned>
                )}
            </Box>
            {/* The answers are the tutorial's own customOptions: per-project author data off
                Firebase, so each disc is filled with IconButton's documented raw-colour prop
                and never with a token from the built-in answer palette. */}
            <Row
                spacing="sm"
                justify="center"
                align="stretch"
                wrap
            >
                {customOptions?.map((option) => (
                    <IconButton
                        key={option.value}
                        name={option.value}
                        label={option.title}
                        accessibilityLabel={option.title}
                        sizeVariant="lg"
                        // FIXME: No casting
                        iconName={option.icon as IconName}
                        backendSurfaceColor={option.iconColor}
                        selected={selectedValue === option.value}
                        disabled={disabled}
                        labelColorVariant="onBrand"
                        onPress={(value) => handleSelect(getTutorialTaskKey(task), value)}
                    />
                ))}
            </Row>
        </Stack>
    );
}

export default ValidateTutorialSession;
