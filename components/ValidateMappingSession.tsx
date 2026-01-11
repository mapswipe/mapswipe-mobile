import { firebaseRef } from "@/utils/firebase";
import { FeatureGeoJson, ValidateProject, ValidateTask } from "@/utils/types";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator } from "react-native";
import { isDefined, isNotDefined } from "@togglecorp/fujs";
import useFirebaseDatabase from "@/hooks/useFirebaseDatabase";
import BlockListView from "@/components/BlockListView";
import { inflate } from 'pako';
import { decode } from 'base-64';
import MapTile from "@/components/MapTile";
import InlineListView from "@/components/InlineListView";
import Button from "@/components/Button";

interface Props {
    taskGroupId: string;
    projectDetails: ValidateProject;
}

function ValidateMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
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
        const charList = decodedStr.split('').map((splitteStr) => {
            return splitteStr.charCodeAt(0)
        })
        const binaryCompressedTasks = new Uint8Array(charList)
        const decompressedTasks = inflate(binaryCompressedTasks, { to: 'string' })

        // FIXME: add schema validation
        return JSON.parse(decompressedTasks) as unknown[]
    }, [compressedTasks]);

    const currentTask = taskList[currentTaskIndex] as ValidateTask | undefined;
    const maxTasks = taskList.length;

    const handleNextPress = useCallback(() => {
        setCurrentTaskIndex(
            (prevTaskIndex) => Math.min(
                prevTaskIndex + 1,
                maxTasks,
            )
        );
    }, [maxTasks]);

    const handlePrevPress = useCallback(() => {
        setCurrentTaskIndex(
            (prevTaskIndex) => Math.max(
                prevTaskIndex - 1,
                0,
            )
        );
    }, [maxTasks]);

    return (
        <BlockListView withPadding>
            {isNotDefined(currentTask?.geojson) && (
                <BlockListView style={{ alignItems: 'center' }}>
                    <ActivityIndicator size="large" />
                </BlockListView>
            )}
            {isDefined(currentTask?.geojson) && (
                <>
                    <MapTile
                        geoJson={currentTask.geojson as FeatureGeoJson}
                        tileServer={projectDetails.tileServer}
                    />
                    <InlineListView
                        spacing="2xs"
                        withCenteredContent
                    >
                        {projectDetails.customOptions?.map((option) => (
                            <Button
                                key={option.value}
                                title={option.title}
                            />
                        ))}
                    </InlineListView>
                    <InlineListView
                        withCenteredContent
                        spacing="2xs"
                    >
                        <Button
                            title="Prev"
                            onPress={handlePrevPress}
                        />
                        <Button
                            title="Next"
                            onPress={handleNextPress}
                        />
                    </InlineListView>
                </>
            )}
        </BlockListView>
    );
}

export default ValidateMappingSession;
