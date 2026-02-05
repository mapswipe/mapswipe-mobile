import {
    CompletenessProject,
    FbMappingGroupTileMapServiceCreateOnlyInput,
    FindProject,
    Results,
    ResultOption,
} from "@/utils/types";
import { compareNumber, isDefined, isNotDefined, listToGroupList, listToMap, mapToList } from "@togglecorp/fujs";
import { FlatList, useWindowDimensions, View } from "react-native";
import useFirebaseDatabase from "@/hooks/useFirebaseDatabase";
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo } from "react";
import { firebaseRef } from "@/utils/firebase";
import { buildTasks } from "@/utils/task";
import ImageTile from "./ImageTile";

interface Props {
    taskGroupId: string;
    projectDetails: FindProject | CompletenessProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
}

function TileGridMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        results,
        onResultsChange,
    } = props;

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

    const options = useMemo<ResultOption[]>(() => ([
        { value: 0, label: 'No', color: 'transparent' },
        { value: 1, label: 'Yes', color: 'green' },
        { value: 2, label: 'Maybe', color: 'yellow' },
        { value: 3, label: 'Bad Imagery', color: 'red' },
    ]), []);


    const getNextValue = useCallback((value: number | undefined) => {
        if (isNotDefined(value)) {
            return options[0].value;
        }

        const optionIndex = options.findIndex(
            ({ value: optionValue }) => value === optionValue
        );

        const nextIndex = optionIndex + 1;
        if (optionIndex === -1 || nextIndex >= options.length) {
            return options[0].value;
        }

        return options[nextIndex].value;
    }, [options]);

    const optionsByValue = useMemo(() => (
        listToMap(options, ({ value }) => value)
    ), [options]);

    const tasks = useMemo(() => {
        if (isNotDefined(groupDetails)) {
            return [];
        }

        return buildTasks(projectDetails, groupDetails);

    }, []);

    useEffect(() => {
        if (isNotDefined(tasks) || tasks.length === 0) {
            return;
        }

        onResultsChange(
            listToMap(
                tasks,
                ({ taskId }) => taskId,
                () => options[0].value,
            )
        );
    }, [tasks, options]);


    const groupedTasks = useMemo(() => {
        if (isNotDefined(tasks) || tasks.length === 0) {
            return [];
        }

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

    const handleTilePress = useCallback((taskId: string) => {
        onResultsChange((prevResults) => ({
            ...prevResults,
            [taskId]: getNextValue(prevResults[taskId]),
        }));
    }, [getNextValue]);

    return (
        <FlatList
            key={groupedTasks.length}
            data={groupedTasks}
            keyExtractor={(groupedTasks) => groupedTasks.taskX}
            renderItem={({ item: groupedTasks }) => (
                <View>
                    {groupedTasks.taskList.map((task) => {
                        const result = results[task.taskId];
                        const selectedOption = isDefined(result)
                            ? optionsByValue[result]
                            : undefined;

                        return (
                            <ImageTile
                                key={task.taskId}
                                taskId={task.taskId}
                                url={task.url}
                                width={tileWidth}
                                tintColor={selectedOption?.color}
                                onPress={handleTilePress}
                            />
                        );
                    })}
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
