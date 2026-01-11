import {
    CompletenessProject,
    FbMappingGroupTileMapServiceCreateOnlyInput,
    FindProject,
} from "@/utils/types";
import { compareNumber, isDefined, isNotDefined, listToGroupList, mapToList } from "@togglecorp/fujs";
import { FlatList, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import useFirebaseDatabase from "@/hooks/useFirebaseDatabase";
import { useMemo } from "react";
import { firebaseRef } from "@/utils/firebase";
import { buildTasks } from "@/utils/task";
import useTheme from "@/hooks/useTheme";

interface Props {
    taskGroupId: string;
    projectDetails: FindProject | CompletenessProject;
}

function TileGridMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
    } = props;

    const theme = useTheme();

    const {
        width: pageWidth,
        height: pageHeight,
    } = useWindowDimensions();

    const taskGroupQuery = useMemo(() => (
        firebaseRef( `v2/groups/${projectDetails.projectId}/${taskGroupId}`)
    ), [taskGroupId]);

    const { data: groupDetails } = useFirebaseDatabase<FbMappingGroupTileMapServiceCreateOnlyInput>({
        query: taskGroupQuery,
    });

    const groupedTasks = useMemo(() => {
        if (isNotDefined(groupDetails)) {
            return [];
        }

        const tasks = buildTasks(projectDetails, groupDetails);

        const sortedTasks = [...tasks].sort(
            (a, b) => compareNumber(a.taskX, b.taskX)
                | compareNumber(a.taskY, b.taskY),
        ).map((task) => {
            const {
                taskX,
                taskY,
                ...otherProps
            } = task;

            if (isNotDefined(taskX) || isNotDefined(taskY)) {
                return undefined;
            }

            return {
                ...otherProps,
                taskX,
                taskY,
            }
        }).filter(isDefined);

        return mapToList(
            listToGroupList(
                sortedTasks,
                (task) => task.taskX,
            ),
            (columnList, key) => ({
                taskX: key,
                taskList: columnList,
            })
        );
    }, [projectDetails, groupDetails]);

    const tileWidth = Math.min(pageWidth / 2, pageHeight / 4);

    return (
        <FlatList
            key={groupedTasks.length}
            data={groupedTasks}
            keyExtractor={(groupedTasks) => groupedTasks.taskX}
            renderItem={({ item: groupedTasks }) => (
                <View>
                    {groupedTasks.taskList.map((task) => (
                        <Image
                            key={task.taskId}
                            source={task.url}
                            style={{
                                width: tileWidth,
                                aspectRatio: 1,
                                borderColor: theme.mapBoundary,
                                borderWidth: 1,
                            }}
                        />
                    ))}
                </View>
            )}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            disableIntervalMomentum
            snapToOffsets={groupedTasks.map((_, i) => i * tileWidth * 2)}
            snapToAlignment="start"
            windowSize={3}
            initialNumToRender={2}
            removeClippedSubviews
        />
    );
}

export default TileGridMappingSession;
