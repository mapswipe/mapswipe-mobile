import {
    useCallback,
    useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
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

import showConfirm from '@/components/showConfirm';
import { showAlert } from '@/components/Toast';
import Banner from '@/components/ui/Banner';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import Grid from '@/components/ui/Grid';
import HeatMap from '@/components/ui/HeatMap';
import InfoCard, { type InfoCardProps } from '@/components/ui/InfoCard';
import ListRow from '@/components/ui/ListRow';
import ListView from '@/components/ui/ListView';
import Screen from '@/components/ui/Screen';
import Section from '@/components/ui/Section';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import {
    communityDashboardUrl,
    supportedLanguages,
} from '@/constants/common';
import { FbUserGroup } from '@/firebaseGenerated/extended_models';
import { useUserGroupStatsQuery } from '@/generated/types/graphql';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
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

const BACK_LABEL = 'Back';

const FALLBACK_TITLE = 'Explore Group';

const MORE_STATS_LABEL = 'More Stats';

// ListView is the only component that owns a RefreshControl, so the body rides in its header slot.
const NO_ROWS: readonly never[] = [];
const noRowKey = () => '';
const noRow = () => null;

type StatEntry = Pick<InfoCardProps, 'label' | 'value'>;

function ExploreGroup() {
    const { id: userGroupId } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const userId = user?.uid;
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
    } = useFirebaseDatabase<FbUserGroup>({
        query: userGroupsQuery,
    });

    const [{
        data: communityUserGroupStatsData,
        fetching: loadingUserGroupStats,
    }, refetchUserGroupStats] = useUserGroupStatsQuery({
        variables: { userGroupId },
    });

    const currentLanguage = useMemo(
        () => (supportedLanguages ?? []).find(
            (lang: { localeCode: string }) => lang.localeCode === i18n.language,
        ),
        [i18n.language],
    );

    const communityUserGroupStats: StatEntry[] = useMemo(() => {
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
        );
        const totalSwipeAreaFormatted = formatNumber(
            Math.round(totalAreaSwiped ?? 0),
        );
        const totalOrganizationFormatted = formatNumber(totalOrganization ?? 0);
        const totalContributorsFormatted = formatNumber(totalContributors ?? 0);

        return [
            {
                label: t('Total swipes'),
                value: totalSwipesFormatted,
            },
            {
                label: t('Total contributors'),
                value: totalContributorsFormatted,
            },
            {
                label: t('Total time spent swiping'),
                value: totalSwipeTimeSegments,
            },
            {
                label: t('Total area swiped (sq.km)'),
                value: totalSwipeAreaFormatted,
            },
            {
                label: t('Total projects'),
                value: totalMappingProjectsFormatted,
            },
            {
                label: t('Organizations supported'),
                value: totalOrganizationFormatted,
            },
        ];
    }, [communityUserGroupStatsData?.communityUserGroupStats?.stats,
        currentLanguage?.localeCode, t]);

    const handleMoreStatsClick = useCallback(() => {
        if (userGroupId) {
            Linking.openURL(`${communityDashboardUrl}/user-group/${userGroupId}/`);
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
                    const logRef = push(firebaseRef('/v2/userGroupMembershipLogs'));
                    const logKey = logRef.key;
                    if (!logKey) throw new Error('Cannot generate log key');

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
            showConfirm({
                title: isJoin ? 'Join User Group' : 'Leave User Group',
                message,
                onConfirm: proceed,
            });
        },
        [userId, userGroupId, router],
    );

    const calendarHeatmapData = useMemo(() => {
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

    const isUserMember = !!userId && !!userGroupData?.users?.[userId];
    const isGroupArchived = !!userGroupData?.archivedAt || !!userGroupData?.archivedBy;

    const body = (
        <>
            {!isUserMember && !isGroupArchived && userGroupData && (
                <Stack
                    spacing="2xs"
                    padding="xs"
                >
                    <Button
                        name="join"
                        title={t('userGroupScreen:joinGroup')}
                        accessibilityLabel={t('userGroupScreen:joinGroup')}
                        colorVariant="positive"
                        onPress={handleUserGroupAction}
                    />
                </Stack>
            )}
            {isGroupArchived && (
                <Banner
                    title={t('This group has been archived')}
                    colorVariant="notice"
                />
            )}
            <Stack
                spacing="xs"
                padding="xs"
            >
                <Text
                    variant="label"
                    colorVariant="secondary"
                >
                    All the stats are only updated once a day
                </Text>
                <Grid spacing="2xs">
                    {communityUserGroupStats.map((item) => (
                        <InfoCard
                            key={item.label}
                            label={item.label}
                            value={item.value}
                            flex="fill"
                        />
                    ))}
                </Grid>
            </Stack>
            <Section
                title={t('profileScreen:contributionHeatmap')}
                withPadding
            >
                <HeatMap activityData={calendarHeatmapData} />
                <ListRow
                    name="moreStat"
                    title={MORE_STATS_LABEL}
                    accessibilityLabel={MORE_STATS_LABEL}
                    affordance="external"
                    onPress={handleMoreStatsClick}
                />
            </Section>
            {isUserMember && (
                <Section
                    title={t('profileScreen:settings')}
                    withPadding
                >
                    <ListRow
                        name="leave"
                        title={t('userGroupScreen:leaveGroup')}
                        accessibilityLabel={t('userGroupScreen:leaveGroup')}
                        colorVariant="negative"
                        onPress={handleUserGroupAction}
                    />
                </Section>
            )}
        </>
    );

    return (
        <Screen
            title={userGroupData?.name ?? FALLBACK_TITLE}
            withHeader
            backAccessibilityLabel={BACK_LABEL}
            // The navigator header already covers the status bar, so only the bottom is ours.
            safeArea="bottom"
            layout="fill"
            headerTitleAlign="start"
            pending={userGroupDetailPending}
            pendingLabel={t('Loading group details...')}
            empty={!userGroupData && (
                <EmptyState
                    title={t('Details not available for this User group')}
                    sizeVariant="inline"
                />
            )}
        >
            <ListView
                data={NO_ROWS}
                keySelector={noRowKey}
                renderItem={noRow}
                spacing="none"
                grow="slot"
                header={body}
                onRefresh={refetchUserGroupStats}
                refreshing={userGroupDetailPending || loadingUserGroupStats}
            />
        </Screen>
    );
}

export default ExploreGroup;
