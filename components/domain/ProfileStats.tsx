import {
    useCallback,
    useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';

import EmptyState from '@/components/ui/EmptyState';
import Grid from '@/components/ui/Grid';
import HeatMap from '@/components/ui/HeatMap';
import InfoCard, { type InfoCardProps } from '@/components/ui/InfoCard';
import ListRow from '@/components/ui/ListRow';
import Section from '@/components/ui/Section';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import {
    communityDashboardUrl,
    supportedLanguages,
} from '@/constants/common';
import { UserStatsQuery } from '@/generated/types/graphql';
import useAuth from '@/hooks/useAuth';
import useUserGroups from '@/hooks/useUserGroup';
import { getTimeSegments } from '@/utils/common';

const MORE_STATS_LABEL = 'More Stats';

type StatEntry = Pick<InfoCardProps, 'label' | 'value'>;

function ProfileStats({ userStats }: {userStats: UserStatsQuery | undefined}) {
    const { user } = useAuth();
    const { t, i18n } = useTranslation('profileScreen');
    const { userGroups } = useUserGroups(user?.uid || '');
    const router = useRouter();

    const statsData = userStats?.communityUserStats;

    const currentLanguage = useMemo(
        () => (supportedLanguages ?? []).find(
            (lang: { localeCode: string }) => lang.localeCode === i18n.language,
        ),
        [i18n.language],
    );

    const userStatsDetails: StatEntry[] = useMemo(() => {
        const stats = statsData?.stats;
        const {
            totalAreaSwiped,
            totalMappingProjects,
            totalOrganization,
            totalSwipeTime,
            totalSwipes,
        } = stats ?? {};

        const totalUserGroups = statsData?.statsLatest?.totalUserGroups;

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
        const totalUserGroupsFormatted = formatNumber(totalUserGroups ?? 0);

        return [
            {
                label: t('Total swipes'),
                value: totalSwipesFormatted,
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
            {
                label: t('User groups joined'),
                value: totalUserGroupsFormatted,
            },
        ];
    }, [
        statsData,
        currentLanguage?.localeCode,
        t,
    ]);

    const handleMoreStatsClick = useCallback(() => {
        if (user?.uid) {
            Linking.openURL(`${communityDashboardUrl}/user/${user?.uid}/`);
        }
    }, [user]);

    const calendarHeatmapData = useMemo(() => {
        const contributionStats = userStats?.communityUserStats?.filteredStats?.swipeByDate;

        if (!contributionStats) {
            return {};
        }

        const contributionStatsMap = contributionStats.reduce(
            (
                acc: Record<string, number>,
                val: { taskDate: string | number; totalSwipes: number },
            ) => {
                acc[val.taskDate] = val.totalSwipes;
                return acc;
            },
            {},
        );

        return contributionStatsMap;
    }, [userStats]);

    const onHandleUserGroupsClick = useCallback((key?: string) => {
        router.push(`exploreGroup/${key}`);
    }, [router]);

    const onHandleExploreGroups = useCallback(() => {
        router.push('(auth)/exploreGroups');
    }, [router]);

    return (
        <>
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
                    {userStatsDetails.map((item) => (
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
                title={t('contributionHeatmap')}
                withPadding
            >
                <HeatMap activityData={calendarHeatmapData} />
                <ListRow
                    title={MORE_STATS_LABEL}
                    accessibilityLabel={MORE_STATS_LABEL}
                    affordance="external"
                    onPress={handleMoreStatsClick}
                />
            </Section>
            <Section
                title="User Groups"
                withPadding
            >
                {userGroups?.length ? (
                    userGroups.map((group) => {
                        const isArchived = Boolean(group.archivedAt || group.archivedBy);
                        const title = isArchived
                            ? `${group.name} (Archived)`
                            : group.name;

                        return (
                            <ListRow
                                key={group.groupId}
                                // The shared handler reads this back to know which group it was.
                                name={group.groupId}
                                title={title}
                                accessibilityLabel={title}
                                affordance="chevron"
                                onPress={onHandleUserGroupsClick}
                            />
                        );
                    })
                ) : (
                    <EmptyState
                        title="No groups yet"
                        sizeVariant="listRow"
                        colorVariant="secondary"
                    />
                )}
                <ListRow
                    title={t('exploreGroups')}
                    accessibilityLabel={t('exploreGroups')}
                    colorVariant="informative"
                    onPress={onHandleExploreGroups}
                />
            </Section>
        </>
    );
}

export default ProfileStats;
