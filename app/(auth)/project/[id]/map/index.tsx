import BlockListView from "@/components/BlockListView";
import Page from "@/components/Page";
import Text from "@/components/Text";
import useFirebaseDatabaseList from "@/hooks/useFirebaseDatabaseList";
import { firebaseRef } from "@/utils/firebase";
import { isDefined, isNotDefined } from "@togglecorp/fujs";
import { router, useLocalSearchParams } from "expo-router";
import { limitToLast, orderByChild, query } from "firebase/database";
import { useEffect, useMemo } from "react";
import { ActivityIndicator } from "react-native";

function MapProjectIndex() {
    const {
        id: projectId,
        taskGroupId,
    } = useLocalSearchParams<{
        id: string;
        taskGroupId: string;
    }>();

    const leastMappedGroupQuery = useMemo(() => query(
            firebaseRef( `v2/groups/${projectId}`),
            orderByChild('requiredCount'),
            limitToLast(1),
        ),
        [projectId]
    );

    const {
        list: leastMappedTaskGroups,
        pending,
    } = useFirebaseDatabaseList<{ groupId: string }>({
        query: leastMappedGroupQuery,
        skip: isDefined(taskGroupId),
    });

    const leastMappedTaskGroupId = leastMappedTaskGroups?.[0]?.groupId;

    useEffect(() => {
        if (isNotDefined(taskGroupId) && isDefined(leastMappedTaskGroupId)) {
            router.replace({
                pathname: '/project/[id]/map/[taskGroupId]',
                params: {
                    id: projectId,
                    taskGroupId: leastMappedTaskGroupId,
                }
            });
        }
    }, [projectId, taskGroupId, leastMappedTaskGroupId]);

    if (pending) {
        return (
            <Page title="Map project">
                <BlockListView
                    withPadding
                    style={{ alignItems: 'center' }}
                >
                    <ActivityIndicator size="large" />
                    <Text>
                        Loading groups...
                    </Text>
                </BlockListView>
            </Page>
        );
    }

    return null;
}

export default MapProjectIndex;
