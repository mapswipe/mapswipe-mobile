import {
    useEffect,
    useLayoutEffect,
    useMemo,
} from 'react';
import { ActivityIndicator } from 'react-native';
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

function MapProjectIndex() {
    const navigation = useNavigation();

    const {
        id: projectId,
        taskGroupId,
        projectInstruction,
    } = useLocalSearchParams<{
        id: string;
        taskGroupId: string;
        projectInstruction: string;
    }>();

    const leastMappedGroupQuery = useMemo(
        () => query(
            firebaseRef(`v2/groups/${projectId}`),
            orderByChild('requiredCount'),
            limitToLast(1),
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

    const leastMappedTaskGroupId = leastMappedTaskGroups?.[0]?.groupId;

    useEffect(() => {
        if (isNotDefined(taskGroupId) && isDefined(leastMappedTaskGroupId)) {
            router.push({
                pathname: '/project/[id]/map/[taskGroupId]',
                params: {
                    id: projectId,
                    taskGroupId: leastMappedTaskGroupId,
                    projectInstruction,
                },
            });
        }
    }, [projectId, taskGroupId, leastMappedTaskGroupId, projectInstruction]);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: String(projectInstruction),
        });
    }, [navigation, projectInstruction, pending]);

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
