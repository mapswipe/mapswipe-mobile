import {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { decode } from 'base-64';
import { inflate } from 'pako';

import HideTileSelectionButton from '@/components/HideTileSelectionButton';
import MapTile from '@/components/MapTile';
import ScaleBar from '@/components/ScaleBar';
import Box from '@/components/ui/Box';
import { type IconName } from '@/components/ui/Icon';
import IconButton from '@/components/ui/IconButton';
import Pager from '@/components/ui/Pager';
import Positioned from '@/components/ui/Positioned';
import ProgressBar from '@/components/ui/ProgressBar';
import Row from '@/components/ui/Row';
import Spinner from '@/components/ui/Spinner';
import Stack from '@/components/ui/Stack';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useFittedTileWidth from '@/hooks/useFittedTileWidth';
import useViewport from '@/hooks/useViewport';
import { firebaseRef } from '@/utils/firebase';
import {
    getBbox,
    getOptimalZoomLevel,
} from '@/utils/geo';
import {
    FeatureGeoJson,
    Results,
    ValidateProject,
    ValidateTask,
} from '@/utils/types';

/**
 * Inline chrome the map does not get: the task page insets it by the `sm` rung on each side, so
 * the pair of gutters is twice that. It has to be stated as one number because it is the reserve
 * `useFittedTileWidth` takes off the page before dividing, and it has to agree with the
 * `padding="sm"` on the page below: the ScaleBar draws its metres against this width, so a
 * reserve smaller than the real padding would over-state the map and under-state the scale.
 */
const TILE_RESERVE_INLINE = 40;

interface Props {
    taskGroupId: string;
    projectDetails: ValidateProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
    onSessionComplete: () => void;
}

function ValidateMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
        onSessionComplete,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [hideTilePressValue, setHideTilePressValue] = useState(false);
    const completedRef = useRef(false);

    // Measured off the window rather than the pager's own viewport, matching
    // CompareMappingSession: the page spans the window, so the two agree, and reading the window
    // keeps the ScaleBar's reference defined on the very first render instead of a frame late.
    const { width: pageWidth } = useViewport();

    const taskQuery = useMemo(() => (
        firebaseRef(`v2/tasks/${projectDetails.projectId}/${taskGroupId}`)
    ), [projectDetails.projectId, taskGroupId]);

    const { data: compressedTasks } = useFirebaseDatabase<string>({
        query: taskQuery,
    });

    const taskList = useMemo(() => {
        if (isNotDefined(compressedTasks)) {
            return [] as ValidateTask[];
        }
        if (Array.isArray(compressedTasks)) {
            return compressedTasks as ValidateTask[];
        }
        if (typeof compressedTasks !== 'string') {
            return [];
        }

        const decodedStr = decode(compressedTasks);
        const charList = decodedStr.split('').map((splitteStr) => splitteStr.charCodeAt(0));
        const binaryCompressedTasks = new Uint8Array(charList);
        const decompressedTasks = inflate(binaryCompressedTasks, { to: 'string' });

        // FIXME: add schema validation
        return JSON.parse(decompressedTasks) as ValidateTask[];
    }, [compressedTasks]);

    const currentTask = taskList[currentTaskIndex] as ValidateTask | undefined;
    const options = projectDetails.customOptions;
    const maxTasks = taskList.length;

    const handleAnswerSelect = useCallback((newValue: number) => {
        if (isDefined(currentTask)) {
            onResultsChange((prevResults) => ({
                ...prevResults,
                [currentTask.taskId]: newValue,
            }));
        }

        const nextIndex = currentTaskIndex + 1;
        if (nextIndex < maxTasks) {
            setCurrentTaskIndex(nextIndex);
        } else if (!completedRef.current) {
            completedRef.current = true;
            onSessionComplete();
        }
    }, [currentTask, onResultsChange, maxTasks, currentTaskIndex, onSessionComplete]);

    const selectedValue = isDefined(currentTask)
        ? results[currentTask.taskId]
        : undefined;

    const handleIndexChange = useCallback((index: number) => {
        setCurrentTaskIndex(index);
    }, []);

    let totalSwipedTasks = 0;
    if (results) {
        totalSwipedTasks = Object.keys(results).length;
        if ('startTime' in results) {
            totalSwipedTasks -= 1;
        }
    }

    const limitedTasks = [...(taskList ?? [])].slice(0, totalSwipedTasks + 1);

    // After "Go back" from the outro the session re-mounts at the first task
    // with all answers intact; re-show the outro once the user swipes back to
    // the final task. (The initial pass completes via handleAnswerSelect.)
    useEffect(() => {
        if (
            maxTasks > 1
            && currentTaskIndex === maxTasks - 1
            && totalSwipedTasks >= maxTasks
            && !completedRef.current
        ) {
            completedRef.current = true;
            onSessionComplete();
        }
    }, [currentTaskIndex, maxTasks, totalSwipedTasks, onSessionComplete]);

    const tileWidth = useFittedTileWidth({
        availableInline: pageWidth,
        reserveInline: TILE_RESERVE_INLINE,
    });

    const handleHideTilePressIn = useCallback(() => {
        setHideTilePressValue(true);
    }, []);

    const handleHideTilePressOut = useCallback(() => {
        setHideTilePressValue(false);
    }, []);

    const disableOptions = currentTaskIndex === -1;

    const selectTaskKey = useCallback(
        (_: ValidateTask, index: number) => index.toString(),
        [],
    );

    const renderTask = useCallback((task: ValidateTask) => {
        const itemGeoJson = task.geojson as FeatureGeoJson;
        const itemBbox = getBbox(itemGeoJson);
        const itemLatitude = isDefined(itemBbox)
            ? (itemBbox[1] + itemBbox[3]) / 2
            : undefined;
        const itemZoom = isDefined(itemBbox)
            ? getOptimalZoomLevel(itemBbox)
            : undefined;

        return (
            <Stack
                spacing="none"
                padding="sm"
                grow="fill"
            >
                {/* Wraps the map with no inset of its own, so the overlays are positioned
                    relative to the map itself rather than drifting below it. */}
                <Box flex={1}>
                    <MapTile
                        geoJson={itemGeoJson}
                        tileServer={projectDetails.tileServer}
                        hideLines={hideTilePressValue}
                    />
                    {isDefined(itemLatitude) && isDefined(itemZoom) && (
                        <Positioned
                            anchor="topStart"
                            offset="3xs"
                            pointerEvents="none"
                        >
                            <ScaleBar
                                latitude={itemLatitude}
                                referenceSize={tileWidth}
                                tileSize={tileWidth}
                                zoomLevel={itemZoom}
                                inline
                            />
                        </Positioned>
                    )}
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
                </Box>
            </Stack>
        );
    }, [
        projectDetails.tileServer,
        hideTilePressValue,
        tileWidth,
        handleHideTilePressIn,
        handleHideTilePressOut,
    ]);

    if (!currentTask?.geojson) {
        return (
            <Box
                flex={1}
                justify="center"
                align="center"
            >
                <Spinner
                    colorVariant="onBrand"
                    accessibilityLabel="Loading tasks"
                />
            </Box>
        );
    }

    return (
        <Stack
            spacing="md"
            grow="fill"
        >
            <Pager
                sizeVariant="page"
                data={limitedTasks}
                keyExtractor={selectTaskKey}
                renderPage={renderTask}
                index={currentTaskIndex}
                onIndexChange={handleIndexChange}
            />
            <Row
                spacing="md"
                justify="center"
                align="stretch"
                wrap
            >
                {options?.map((option) => (
                    <IconButton
                        name={option.value}
                        key={option.value}
                        label={option.title}
                        accessibilityLabel={option.title}
                        onPress={handleAnswerSelect}
                        sizeVariant="lg"
                        // FIXME: No casting
                        iconName={option.icon as IconName}
                        backendSurfaceColor={option.iconColor}
                        selected={selectedValue === option.value}
                        disabled={disableOptions}
                        labelColorVariant="onBrand"
                    />
                ))}
            </Row>
            <ProgressBar
                progress={totalSwipedTasks / maxTasks}
                colorVariant="onBrand"
                accessibilityLabel="Session progress"
            />
        </Stack>
    );
}

export default ValidateMappingSession;
