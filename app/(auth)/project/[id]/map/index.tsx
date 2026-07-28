import {
    useEffect,
    useMemo,
} from 'react';
import {
    ActivityIndicator,
    StyleSheet,
} from 'react-native';
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

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Page from '@/components/Page';
import Text from '@/components/Text';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useFirebaseDatabaseList from '@/hooks/useFirebaseDatabaseList';
import useTheme from '@/hooks/useTheme';
import { firebaseRef } from '@/utils/firebase';
import { FbProject } from '@/utils/types';

const TASK_CONTRIBUTION_COUNT_KEY = 'taskContributionCount';

// A project can hold thousands of groups, so we only ever pull a small window
// of them. 15 is what the previous app used and it leaves plenty of slack after
// the already-mapped ones are filtered out.
const GROUP_WINDOW_SIZE = 15;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    completedText: {
        textAlign: 'center',
    },
});

function MapProjectIndex() {
    const theme = useTheme();
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

    // Ordering by requiredCount and taking the *last* slice puts the groups that
    // still need the most mappers at the front of the queue. We deliberately do
    // not filter on requiredCount > 0: a group whose count was never written by
    // the import would be dropped by such a filter and become unmappable
    // forever, whereas serving an already-satisfied group is harmless — a
    // duplicate contribution is rejected server-side.
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

    // Groups this user has already contributed to in this project (keyed by
    // groupId), so we never hand them the same group twice.
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

    // A project can cap how much a single user contributes to it, so no one
    // mapper dominates the results a group is verified against. Users can
    // overshoot the cap mid-session, so this is a `>=` check, not `===`.
    const tasksCompleted = Number(userContributions?.[TASK_CONTRIBUTION_COUNT_KEY] ?? 0);
    const maxTasksPerUser = Number(project?.maxTasksPerUser ?? 0);
    const userCanMap = maxTasksPerUser <= 0 || tasksCompleted < maxTasksPerUser;

    // Drop the groups this user has already mapped, plus the one they just
    // finished — its contribution is written by a Cloud Function and may not
    // have propagated into `userContributions` yet.
    const groupsToPickFrom = useMemo(() => {
        const mappedGroupIds = new Set(
            Object.keys(userContributions ?? {})
                .filter((key) => key !== TASK_CONTRIBUTION_COUNT_KEY),
        );
        return availableGroups.filter((group) => (
            !mappedGroupIds.has(group.key)
            && group.key !== previousGroupId
        ));
    }, [availableGroups, userContributions, previousGroupId]);

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

    if (!pending && (!userCanMap || groupsToPickFrom.length === 0)) {
        // The per-user cap is the one case we can explain precisely. Otherwise
        // all we know is that this user's window of groups is exhausted, which
        // says nothing about the project as a whole.
        let title = 'All done!';
        let description = 'You\'ve completed all available groups for this project. Thank you!';

        if (!userCanMap) {
            title = 'That\'s your limit for this project';
            description = 'You\'ve reached the maximum number of tasks for this project. Thank you!';
        }

        return (
            <Page
                title="Map project"
                variant="brand"
                scrollable={false}
            >
                <BlockListView
                    withPadding
                    withCenteredContent
                    style={styles.container}
                    spacing="md"
                >
                    <Icon
                        name="checkmark-outline"
                        color={theme.primaryGreen}
                        size={96}
                        weight="bold"
                    />
                    <Text
                        variant="title"
                        colorVariant="brand"
                        style={styles.completedText}
                    >
                        {title}
                    </Text>
                    <Text
                        colorVariant="brand"
                        style={styles.completedText}
                    >
                        {description}
                    </Text>
                    <Button
                        name="back-to-projects"
                        colorVariant="primaryRed"
                        styleVariant="filled"
                        title="Back to projects"
                        onPress={() => router.replace('/projects')}
                    />
                </BlockListView>
            </Page>
        );
    }

    // Still loading, or about to redirect to the selected group.
    return (
        <Page
            title="Map project"
            scrollable={false}
            variant="brand"
        >
            <BlockListView
                withPadding
                withCenteredContent
                style={styles.container}
            >
                <ActivityIndicator size="large" />
                <Text colorVariant="brand">
                    Loading groups...
                </Text>
            </BlockListView>
        </Page>
    );
}

export default MapProjectIndex;
