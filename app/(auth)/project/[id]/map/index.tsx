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
    orderByChild,
    query,
    startAfter,
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
    const navigation = useNavigation();
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

    // Groups that still need contributions (requiredCount > 0) — i.e. fewer than
    // `verificationNumber` unique users have mapped them yet. Once a group has
    // enough contributors its requiredCount is 0 and it drops out here.
    const availableGroupsQuery = useMemo(
        () => query(
            firebaseRef(`v2/groups/${projectId}`),
            orderByChild('requiredCount'),
            startAfter(0),
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

    const pending = groupsPending || contributionsPending;

    // Eligible = still needs contributions (query) AND not already mapped by this
    // user AND not the group we just finished — that group's contribution and
    // requiredCount are updated by the backend and may not have propagated yet.
    const eligibleGroups = useMemo(() => {
        const mappedGroupIds = new Set(Object.keys(userContributions ?? {}));
        return availableGroups.filter((group) => (
            !mappedGroupIds.has(group.key)
            && group.key !== previousGroupId
        ));
    }, [availableGroups, userContributions, previousGroupId]);

    useEffect(() => {
        if (skipSelection || pending || eligibleGroups.length === 0) {
            return;
        }
        const index = Math.floor(Math.random() * eligibleGroups.length);
        router.replace({
            pathname: '/project/[id]/map/[taskGroupId]',
            params: {
                id: projectId,
                taskGroupId: eligibleGroups[index].key,
                projectInstruction,
            },
        });
    }, [skipSelection, pending, eligibleGroups, projectId, projectInstruction]);

    useLayoutEffect(() => {
        navigation.setOptions({
            title: String(projectInstruction),
        });
    }, [navigation, projectInstruction]);

    if (skipSelection) {
        return null;
    }

    if (!pending && eligibleGroups.length === 0) {
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
                        All done!
                    </Text>
                    <Text
                        colorVariant="brand"
                        style={styles.completedText}
                    >
                        You&apos;ve completed all available groups for this project. Thank you!
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
