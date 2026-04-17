import React, {
    useCallback,
    useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    Linking,
    StyleSheet,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
    managerDashboardUrl,
    supportedLanguages,
} from '@/constants/common';
import { UserStatsQuery } from '@/generated/types/graphql';
import useAuth from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import useUserGroups from '@/hooks/useUserGroup';
import { getTimeSegments } from '@/utils/common';

import BlockListView from './BlockListView';
import Button from './Button';
import HeatMap from './HeatMap';
import Icon from './Icon';
import InfoCard, { StatsInfo } from './InfoCard';
import Text from './Text';

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

function ProfileStats({ userStats }: {userStats: UserStatsQuery | undefined}) {
    const { user } = useAuth();
    const { t, i18n } = useTranslation('profileScreen');
    const { userGroups } = useUserGroups(user?.uid || '');
    const styles = useThemedStyles(createStyles);
    const router = useRouter();
    const theme = useTheme();

    const statsData = userStats?.communityUserStats;

    const currentLanguage = useMemo(
        () => (supportedLanguages ?? []).find(
            (lang: { localeCode: string }) => lang.localeCode === i18n.language,
        ),
        [i18n.language],
    );

    const userStatsDetails: StatsInfo[] = useMemo(() => {
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
                title: t('Total swipes'),
                value: totalSwipesFormatted,
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
            {
                title: t('User groups joined'),
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
            Linking.openURL(`${managerDashboardUrl}/user/${user?.uid}/`);
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
            <BlockListView
                withPadding
                spacing="xs"
            >
                <Text
                    variant="label"
                >
                    All the stats are only updated once a day
                </Text>
                <View style={styles.infoCardContainer}>
                    {userStatsDetails.map((item) => (
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
                <Text
                    variant="title"
                >
                    {t('contributionHeatmap')}
                </Text>
                <HeatMap activityData={calendarHeatmapData} />
                <Button
                    name="MoreStats"
                    title="More Stats"
                    onPress={handleMoreStatsClick}
                    action={<Icon name="sign-out" size={18} color={theme.info} />}
                    styleVariant="block"
                />
            </BlockListView>
            <BlockListView
                withPadding
                spacing="xs"
            >
                <Text variant="title">User Groups</Text>
                {userGroups?.length ? (
                    userGroups.map((group) => (
                        <Button
                            key={group.groupId}
                            name={group.groupId}
                            title={
                                group.archivedAt || group.archivedBy
                                    ? `${group.name} (Archived)`
                                    : group.name
                            }
                            onPress={onHandleUserGroupsClick}
                            styleVariant="block"
                            action={(
                                <Icon name="caret-right" size={14} />
                            )}
                        />
                    ))
                ) : (
                    <Text variant="label">No groups yet</Text>)}
                <Button
                    name="exploreGroups"
                    title={t('exploreGroups')}
                    onPress={onHandleExploreGroups}
                    colorVariant="info"
                    styleVariant="block"
                />
            </BlockListView>
        </>
    );
}

export default ProfileStats;
