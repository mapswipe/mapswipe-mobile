import {
    Dispatch,
    SetStateAction,
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { decode } from 'base-64';
import { inflate } from 'pako';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import InlineListView from '@/components/InlineListView';
import MapTile from '@/components/MapTile';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import {
    FeatureGeoJson,
    Results,
    ValidateProject,
    ValidateTask,
} from '@/utils/types';

import { type IconName } from './Icon';
import IconButton from './IconButton';

const styles = StyleSheet.create({
    loadingContainer: {
        alignItems: 'center',
    },
});

interface Props {
    taskGroupId: string;
    projectDetails: ValidateProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
}

function ValidateMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

    const taskQuery = useMemo(() => (
        firebaseRef(`v2/tasks/${projectDetails.projectId}/${taskGroupId}`)
    ), [projectDetails.projectId, taskGroupId]);

    const { data: compressedTasks } = useFirebaseDatabase<string>({
        query: taskQuery,
    });

    const taskList = useMemo(() => {
        if (isNotDefined(compressedTasks) || typeof compressedTasks !== 'string') {
            return [];
        }

        const decodedStr = decode(compressedTasks);
        const charList = decodedStr.split('').map((splitteStr) => splitteStr.charCodeAt(0));
        const binaryCompressedTasks = new Uint8Array(charList);
        const decompressedTasks = inflate(binaryCompressedTasks, { to: 'string' });

        // FIXME: add schema validation
        return JSON.parse(decompressedTasks) as unknown[];
    }, [compressedTasks]);

    const currentTask = taskList[currentTaskIndex] as ValidateTask | undefined;
    const maxTasks = taskList.length;

    const handleNextPress = useCallback(() => {
        setCurrentTaskIndex(
            (prevTaskIndex) => Math.min(
                prevTaskIndex + 1,
                maxTasks,
            ),
        );
    }, [maxTasks]);

    const handlePrevPress = useCallback(() => {
        setCurrentTaskIndex(
            (prevTaskIndex) => Math.max(
                prevTaskIndex - 1,
                0,
            ),
        );
    }, []);

    const options = projectDetails.customOptions;

    const handleAnswerSelect = useCallback((newValue: number) => {
        if (isDefined(currentTask)) {
            onResultsChange((prevResults) => ({
                ...prevResults,
                [currentTask.taskId]: newValue,
            }));
        }
    }, [currentTask, onResultsChange]);

    const selectedValue = isDefined(currentTask)
        ? results[currentTask.taskId]
        : undefined;

    return (
        <BlockListView withPadding>
            {isNotDefined(currentTask?.geojson) && (
                <BlockListView style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                </BlockListView>
            )}
            {isDefined(currentTask?.geojson) && (
                <>
                    <MapTile
                        geoJson={currentTask.geojson as FeatureGeoJson}
                        tileServer={projectDetails.tileServer}
                    />
                    <InlineListView withCenteredContent>
                        {options?.map((option) => (
                            <IconButton
                                name={option.value}
                                key={option.value}
                                title={option.title}
                                onPress={handleAnswerSelect}
                                // FIXME: No casting
                                iconName={option.icon as IconName}
                                tintColor={option.iconColor}
                                active={selectedValue === option.value}
                            />
                        ))}
                    </InlineListView>
                    <InlineListView withSpaceBetweenContents>
                        <Button
                            name="prev"
                            title="Prev"
                            onPress={handlePrevPress}
                        />
                        <Button
                            name="next"
                            title="Next"
                            onPress={handleNextPress}
                            disabled={isNotDefined(selectedValue)}
                        />
                    </InlineListView>
                </>
            )}
        </BlockListView>
    );
}

export default ValidateMappingSession;
