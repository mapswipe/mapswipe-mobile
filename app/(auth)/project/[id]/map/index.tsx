import {
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import {
    router,
    useLocalSearchParams,
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

import EmptyState from '@/components/ui/EmptyState';
import Screen from '@/components/ui/Screen';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useFirebaseDatabaseList from '@/hooks/useFirebaseDatabaseList';
import { firebaseRef } from '@/utils/firebase';
import { FbProject } from '@/utils/types';

const TASK_CONTRIBUTION_COUNT_KEY = 'taskContributionCount';

// A project can hold thousands of groups, so only a small window is ever pulled.
const GROUP_WINDOW_SIZE = 15;

function MapProjectIndex() {
    const { user } = useAuth();
    const userId = user?.uid;

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

    // This screen only picks a group; a direct taskGroupId means that's done.
    const skipSelection = isDefined(taskGroupId);

    // The last slice by requiredCount is the neediest groups. Deliberately no `requiredCount > 0`
    // filter: a group whose count was never written would become unmappable forever.
    const availableGroupsQuery = useMemo(
        () => query(
            firebaseRef(`v2/groups/${projectId}`),
            orderByChild('requiredCount'),
            limitToLast(GROUP_WINDOW_SIZE),
        ),
        [projectId],
    );

    const {
        list: availableGroups,
        pending: groupsPending,
    } = useFirebaseDatabaseList<{ requiredCount?: number }>({
        query: availableGroupsQuery,
        skip: skipSelection,
    });

    const projectQuery = useMemo(
        () => firebaseRef(`v2/projects/${projectId}`),
        [projectId],
    );

    const {
        data: project,
        pending: projectPending,
    } = useFirebaseDatabase<FbProject>({
        query: projectQuery,
        skip: skipSelection,
    });

    const contributionsQuery = useMemo(
        () => (isDefined(userId)
            ? firebaseRef(`v2/users/${userId}/contributions/${projectId}`)
            : undefined),
        [userId, projectId],
    );

    const {
        data: userContributions,
        pending: contributionsPending,
    } = useFirebaseDatabase<Record<string, unknown>>({
        query: contributionsQuery,
        skip: skipSelection || isNotDefined(userId),
    });

    const pending = groupsPending || contributionsPending || projectPending;

    // Users can overshoot the per-project cap mid-session, so compare by range, not equality.
    const tasksCompleted = Number(userContributions?.[TASK_CONTRIBUTION_COUNT_KEY] ?? 0);
    const maxTasksPerUser = Number(project?.maxTasksPerUser ?? 0);
    const userCanMap = maxTasksPerUser <= 0 || tasksCompleted < maxTasksPerUser;

    const groupsToPickFrom = useMemo(() => {
        const mappedGroupIds = new Set(
            Object.keys(userContributions ?? {})
                .filter((key) => key !== TASK_CONTRIBUTION_COUNT_KEY),
        );
        const repeatableGroups = availableGroups.filter(
            (group) => group.key !== previousGroupId,
        );
        const unmappedGroups = repeatableGroups.filter(
            (group) => !mappedGroupIds.has(group.key),
        );
        return unmappedGroups.length > 0 ? unmappedGroups : repeatableGroups;
    }, [availableGroups, userContributions, previousGroupId]);

    const handleBackToProjectsPress = useCallback(() => {
        router.replace('/projects');
    }, []);

    useEffect(() => {
        if (skipSelection || pending || !userCanMap || groupsToPickFrom.length === 0) {
            return;
        }
        const index = Math.floor(Math.random() * groupsToPickFrom.length);
        router.replace({
            pathname: '/project/[id]/map/[taskGroupId]',
            params: {
                id: projectId,
                taskGroupId: groupsToPickFrom[index].key,
                projectInstruction,
            },
        });
    }, [skipSelection, pending, userCanMap, groupsToPickFrom, projectId, projectInstruction]);

    if (skipSelection) {
        return null;
    }

    const exhausted = !pending && (!userCanMap || groupsToPickFrom.length === 0);

    const atLimit = !userCanMap;
    const title = atLimit
        ? 'That\'s your limit for this project'
        : 'All done!';
    const description = atLimit
        ? 'You\'ve reached the maximum number of tasks for this project. Thank you!'
        : 'You\'ve completed all available groups for this project. Thank you!';

    return (
        <Screen
            title="Map project"
            colorVariant="brand"
            pending={!exhausted}
            pendingLabel="Loading groups..."
            empty={exhausted && (
                <EmptyState
                    sizeVariant="page"
                    colorVariant="onBrand"
                    iconName="checkmark-outline"
                    iconColorVariant="positive"
                    title={title}
                    description={description}
                    actionLabel="Back to projects"
                    actionAccessibilityLabel="Back to projects"
                    actionColorVariant="negative"
                    onActionPress={handleBackToProjectsPress}
                />
            )}
        />
    );
}

export default MapProjectIndex;
