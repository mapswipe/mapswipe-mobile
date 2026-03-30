import React, {
    useCallback,
    useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router/build/hooks';
import {
    push,
    query,
    update,
} from 'firebase/database';
import { gql } from 'urql';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import HeatMap from '@/components/HeatMap';
import Icon from '@/components/Icon';
import InfoCard, { StatsInfo } from '@/components/InfoCard';
import InlineListView from '@/components/InlineListView';
import Page from '@/components/Page';
import Text from '@/components/Text';
import { showAlert } from '@/components/Toast';
import {
    publicDashboardUrl,
    supportedLanguages,
} from '@/constants/common';
import { useUserGroupStatsQuery } from '@/generated/types/graphql';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { getTimeSegments } from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const USER_GROUP_STATS = gql`
    query UserGroupStats($userGroupId: ID!) {
        communityUserGroupStats(userGroupId: { firebaseId: $userGroupId }) {
            stats {
                totalContributors
                totalMappingProjects
                totalSwipes
                totalAreaSwiped
                totalSwipeTime
                totalOrganization
            }
            filteredStats {
                swipeByDate {
                    taskDate
                    totalSwipes
                }
            }
        }
    }
`;

interface userGroup {
    createdAt: number;
    createdBy: string;
    description: string;
    name: string;
    nameKey: string;
}

const createStyles = () => StyleSheet.create({
    infoCardContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 10,
    },
    infoCard: {
        width: '48%',
        marginBottom: 12,
    },
});

function ExploreGroup() {
    const { id: userGroupId } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const userId = user?.uid;
    const styles = useThemedStyles(createStyles);
    const theme = useTheme();
    const router = useRouter();
    const { t, i18n } = useTranslation(['profileScreen', 'userGroupScreen']);

    const userGroupsQuery = useMemo(() => (
        query(
            firebaseRef(`/v2/userGroups/${userGroupId}/`),
        )
    ), [userGroupId]);

    const {
        data: userGroupData,
        pending: userGroupDetailPending,
    } = useFirebaseDatabase<userGroup>({
        query: userGroupsQuery,
    });

    const [{
        data: communityUserGroupStatsData,
        fetching: loadingUserGroupStats,
    }, refetchUserGroupStats] = useUserGroupStatsQuery({
        variables: { userGroupId },
    });

    const currentLanguage = (supportedLanguages ?? []).find(
        (lang: { localeCode: string }) => lang.localeCode === i18n.language,
    );

    const communityUserGroupStats: StatsInfo[] = useMemo(() => {
        const stats = communityUserGroupStatsData?.communityUserGroupStats?.stats;
        const {
            totalContributors,
            totalMappingProjects,
            totalSwipes,
            totalAreaSwiped,
            totalSwipeTime,
            totalOrganization,
        } = stats ?? {};

        const formatter = new Intl.NumberFormat(currentLanguage?.localeCode);
        const formatNumber = formatter.format;

        const totalSwipesFormatted = formatNumber(totalSwipes ?? 0);
        const totalMappingProjectsFormatted = formatNumber(
            totalMappingProjects ?? 0,
        );
        const totalSwipeTimeSegments = getTimeSegments(totalSwipeTime ?? 0).map(
            (segment) => ({
                value: String(segment.value),
                unit: segment.unit,
            }),
        ); const totalSwipeAreaFormatted = formatNumber(
            Math.round(totalAreaSwiped ?? 0),
        );
        const totalOrganizationFormatted = formatNumber(totalOrganization ?? 0);
        const totalContributorsFormatted = formatNumber(totalContributors ?? 0);

        return [
            {
                title: t('Total swipes'),
                value: totalSwipesFormatted,
            },
            {
                title: t('Total contributors'),
                value: totalContributorsFormatted,
            },
            {
                title: t('Total time spent swiping'),
                value: totalSwipeTimeSegments,
            },
            {
                title: t('Total area swiped (sq.km)'),
                value: totalSwipeAreaFormatted,
            },
            {
                title: t('Total projects'),
                value: totalMappingProjectsFormatted,
            },
            {
                title: t('Organizations supported'),
                value: totalOrganizationFormatted,
            },
        ];
    }, [communityUserGroupStatsData?.communityUserGroupStats?.stats,
        currentLanguage?.localeCode, t]);

    const handleMoreStatsClick = useCallback(() => {
        if (userGroupId) {
            Linking.openURL(`${publicDashboardUrl}/user-group/${userGroupId}/`);
        }
    }, [userGroupId]);

    type UserGroupAction = 'join' | 'leave';

    const handleUserGroupAction = useCallback(
        (action: UserGroupAction) => {
            const isJoin = action === 'join';

            const message = isJoin
                ? 'Are you sure you want to join this group?'
                : 'Are you sure you want to leave this group?\n\nAfter you leave, you will still remain on the leaderboard. Contributions made while a member will still count, but contributions after leaving will not.';

            const proceed = async () => {
                try {
                    // Create log entry
                    const logRef = push(firebaseRef('/v2/userGroupMembershipLogs'));
                    const logKey = logRef.key;
                    if (!logKey) throw new Error('Cannot generate log key');

                    // Prepare updates
                    const updates: Record<string, unknown> = {
                        [`/v2/users/${userId}/userGroups/${userGroupId}`]: isJoin ? true : null,
                        [`/v2/userGroups/${userGroupId}/users/${userId}`]: isJoin ? true : null,
                        [`/v2/userGroupMembershipLogs/${logKey}`]: {
                            userId,
                            userGroupId,
                            action,
                            timestamp: Date.now(),
                        },
                    };

                    await update(firebaseRef('/'), updates);

                    // Show success
                    showAlert({
                        title: `Usergroup ${isJoin ? 'joined' : 'left'}`,
                        message: isJoin
                            ? 'You have successfully joined the group'
                            : 'You have successfully left the group',
                        alertType: 'success',
                    });

                    if (!isJoin) router.back();
                } catch (error) {
                    showAlert({
                        title: `Failed to ${action} Usergroup`,
                        message: (error as string) || 'An error occurred',
                        alertType: 'error',
                    });
                }
            };
            Alert.alert(
                isJoin ? 'Join User Group' : 'Leave User Group',
                message,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'OK', onPress: proceed },
                ],
            );
        },
        [userId, userGroupId, router],
    );

    const calendarHeatmapData = React.useMemo(() => {
        const contributionStats = communityUserGroupStatsData
            ?.communityUserGroupStats?.filteredStats
            ?.swipeByDate;

        if (!contributionStats) {
            return {};
        }

        const contributionStatsMap = contributionStats
            .reduce((acc: Record<string, number>, val:
                { taskDate: string | number; totalSwipes: number; }) => {
                acc[val.taskDate] = val.totalSwipes;
                return acc;
            }, {});

        return contributionStatsMap;
    }, [communityUserGroupStatsData?.communityUserGroupStats?.filteredStats?.swipeByDate]);

    return (
        <Page
            title={userGroupData?.name ?? 'Explore Group'}
            isScrollable={false}
            showBackButton
        >
            <InlineListView
                withPadding
                spacing="2xs"
            >
                <Button
                    name="Join"
                    title={t('userGroupScreen:joinGroup')}
                    colorVariant="success"
                    onPress={() => handleUserGroupAction('join')}
                />
            </InlineListView>
            <ScrollView
                refreshControl={(
                    <RefreshControl
                        refreshing={
                            userGroupDetailPending
                            || loadingUserGroupStats
                        }
                        onRefresh={refetchUserGroupStats}
                    />
                )}
            >
                <BlockListView
                    withPadding
                    spacing="xs"
                >
                    <Text variant="label">
                        All the stats are only updated once a day
                    </Text>
                    <View style={styles.infoCardContainer}>
                        {communityUserGroupStats.map((item) => (
                            <InfoCard
                                key={item.title}
                                title={item.title}
                                value={item.value}
                                style={styles.infoCard}
                            />
                        ))}
                    </View>
                </BlockListView>
                <BlockListView
                    withPadding
                    spacing="xs"
                >
                    <Text variant="title">
                        {t('profileScreen:contributionHeatmap')}
                    </Text>
                    <HeatMap activityData={calendarHeatmapData} />
                    <Button
                        name="moreStat"
                        title="More Stats"
                        onPress={handleMoreStatsClick}
                        action={(
                            <Icon
                                name="sign-out"
                                size={18}
                                color={theme.info}
                            />
                        )}
                        styleVariant="block"
                    />
                </BlockListView>
                <BlockListView
                    withPadding
                    spacing="xs"
                >
                    <Text variant="title">
                        {t('profileScreen:settings')}
                    </Text>
                    <Button
                        name="leaveGroup"
                        title={t('userGroupScreen:leaveGroup')}
                        onPress={() => handleUserGroupAction('leave')}
                        styleVariant="block"
                    />
                </BlockListView>
            </ScrollView>
        </Page>
    );
}

export default ExploreGroup;
