import {
    useEffect,
    useLayoutEffect,
    useMemo,
} from 'react';
import {
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
import {
    router,
    useLocalSearchParams,
    useNavigation,
} from 'expo-router';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    limitToLast,
    orderByChild,
    query,
} from 'firebase/database';

import BlockListView from '@/components/BlockListView';
import Page from '@/components/Page';
import Text from '@/components/Text';
import useFirebaseDatabaseList from '@/hooks/useFirebaseDatabaseList';
import { firebaseRef } from '@/utils/firebase';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
function MapProjectIndex() {
    const navigation = useNavigation();

    const {
        id: projectId,
        taskGroupId,
        projectInstruction,
        previousGroupId,
    } = useLocalSearchParams<{
        id: string;
        taskGroupId: string;
        projectInstruction: string;
        previousGroupId: string;
    }>();

    const leastMappedGroupQuery = useMemo(
        () => query(
            firebaseRef(`v2/groups/${projectId}`),
            orderByChild('requiredCount'),
            limitToLast(10),
        ),
        [projectId],
    );

    const {
        list: leastMappedTaskGroups,
        pending,
    } = useFirebaseDatabaseList<{ groupId: string }>({
        query: leastMappedGroupQuery,
        skip: isDefined(taskGroupId),
    });

    const selectedTaskGroupId = useMemo(() => {
        if (isNotDefined(leastMappedTaskGroups) || leastMappedTaskGroups.length === 0) {
            return undefined;
        }

        const candidates = previousGroupId
            ? leastMappedTaskGroups.filter((g) => g.groupId !== previousGroupId)
            : leastMappedTaskGroups;

        const pool = candidates.length > 0 ? candidates : leastMappedTaskGroups;
        const index = Math.floor(Math.random() * pool.length);
        return pool[index].groupId;
    }, [leastMappedTaskGroups, previousGroupId]);

    useEffect(() => {
        if (isNotDefined(taskGroupId) && isDefined(selectedTaskGroupId)) {
            router.replace({
                pathname: '/project/[id]/map/[taskGroupId]',
                params: {
                    id: projectId,
                    taskGroupId: selectedTaskGroupId,
                    projectInstruction,
                },
            });
        }
    }, [projectId, taskGroupId, selectedTaskGroupId, projectInstruction]);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: String(projectInstruction),
        });
    }, [navigation, projectInstruction, pending]);

    if (pending) {
        return (
            <Page
                title="Map project"
                scrollable={false}
            >
                <BlockListView
                    withPadding
                    withCenteredContent
                    style={styles.container}
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
