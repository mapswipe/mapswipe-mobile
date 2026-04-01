import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    View,
} from 'react-native';
import { Bar } from 'react-native-progress';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isDefined } from '@togglecorp/fujs';
import { gql } from 'urql';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import { ButtonLayoutProps } from '@/components/ButtonLayout';
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
import {
    FONT_SIZE_SM,
    SPACING_MD,
} from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import { FbUser } from '@/firebaseGenerated/extended_models';
import { useUserStatsQuery } from '@/generated/types/graphql';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import useUserGroups from '@/hooks/useUserGroup';
import { getTimeSegments } from '@/utils/common';
import {
    firebaseAuth,
    firebaseRef,
} from '@/utils/firebase';
import getLevelInfo from '@/utils/getLevel';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const USER_STATS = gql`
  query UserStats($firebaseId: ID!) {
    communityUserStats(userId: { firebaseId: $firebaseId }) {
      stats {
        totalAreaSwiped
        totalMappingProjects
        totalOrganization
        totalSwipeTime
        totalSwipes
      }
      filteredStats {
        swipeByDate {
          taskDate
          totalSwipes
        }
      }
      statsLatest {
        totalUserGroups
      }
    }
  }
`;

const createStyles = (theme: AppTheme) => StyleSheet.create({
    page: {
        backgroundColor: theme.backgroundMuted,
    },
    displayPicture: {
        width: 100,
        height: 100,
        aspectRatio: 1,
        borderRadius: 50,
    },
    profileCard: {
        backgroundColor: theme.primaryBlue,
        color: theme.primaryRed,
        alignItems: 'center',
    },
    profileDetail: {
        backgroundColor: theme.primaryBlue,
        color: theme.primaryRed,
        justifyContent: 'center',
        flex: 2,
    },
    profileDetailsText: {
        color: theme.card,
        fontWeight: 'bold',
    },
    levelText: {
        color: theme.card,
        fontSize: FONT_SIZE_SM,
    },
    progressText: {
        color: theme.card,
        fontSize: FONT_SIZE_SM,
    },
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
    alignCenter: {
        alignItems: 'center',
    },
    switch: {
        transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }],
        height: 18,
    },
});

const ACCESSIBILITY_KEY = '@accessibility';

function Profile() {
    const { user } = useAuth();
    const router = useRouter();
    const styles = useThemedStyles(createStyles);
    const [accessibility, setAccessibility] = useState<string>('disabled');
    const { t, i18n } = useTranslation('profileScreen');

    const userDetailQuery = useMemo(
        () => (isDefined(user) ? firebaseRef(`v2/users/${user.uid}`) : undefined),
        [user],
    );
    const { data: userDetails } = useFirebaseDatabase<FbUser>({
        query: userDetailQuery,
    });
    const [
        { data: userStatsData, fetching: loadingUserStats },
        refetchUserStats,
    ] = useUserStatsQuery({
        variables: { firebaseId: user.uid || '' },
    });

    const { userGroups } = useUserGroups({ userId: user?.uid });

    const {
        level, sqkm, swipes, levelData, progress,
    } = getLevelInfo(userDetails?.taskContributionCount ?? 0);

    const levelProgressText = t('xTasks(sSwipes)UntilTheNextLevel', {
        sqkm,
        swipes,
    });

    useEffect(() => {
        const load = async () => {
            const value = await AsyncStorage.getItem(ACCESSIBILITY_KEY);
            setAccessibility(value ?? '');
        };
        load();
    }, []);

    const currentLanguage = (supportedLanguages ?? []).find(
        (lang: { localeCode: string }) => lang.localeCode === i18n.language,
    );

    const refreshPage = useCallback(() => {
        refetchUserStats();
    }, [refetchUserStats]);

    const userStats: StatsInfo[] = useMemo(() => {
        const stats = userStatsData?.communityUserStats?.stats;
        const {
            totalAreaSwiped,
            totalMappingProjects,
            totalOrganization,
            totalSwipeTime,
            totalSwipes,
        } = stats ?? {};

        const totalUserGroups = userStatsData?.communityUserStats?.statsLatest?.totalUserGroups;

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
        userStatsData?.communityUserStats?.stats,
        userStatsData?.communityUserStats?.statsLatest?.totalUserGroups,
        currentLanguage?.localeCode,
        t,
    ]);

    const handleLogout = useCallback(() => {
        firebaseAuth.signOut();
    }, []);

    const theme = useTheme();

    const onHandleChangeUsername = useCallback(() => {
        router.push('(auth)/changeUsername');
    }, [router]);

    const onHandleChangeLanguage = useCallback(() => {
        router.push({
            pathname: 'languageSelection',
            params: { isDarkBackground: String(false) },
        });
    }, [router]);

    const onHandleExploreGroups = useCallback(() => {
        router.push('(auth)/exploreGroups');
    }, [router]);
    const onHandleUserGroupsClick = useCallback((key?: string) => {
        router.push(`exploreGroup/${key}`);
    }, [router]);

    const onHandleAccessibilityChange = useCallback(async () => {
        const newValue = accessibility === 'enabled' ? 'disabled' : 'enabled';
        await AsyncStorage.setItem(ACCESSIBILITY_KEY, newValue);
        setAccessibility(newValue);
    }, [accessibility]);

    const onHandleMissingMapsClick = useCallback(() => {
        router.push({
            pathname: '/WebviewWindow',
            params: { uri: 'https://www.missingmaps.org' },
        });
    }, [router]);

    const onHandleMapSwipeWebsiteClick = useCallback(() => {
        router.push({
            pathname: '/WebviewWindow',
            params: { uri: 'https://mapswipe.org/' },
        });
    }, [router]);

    const onHandleEmailClick = useCallback(() => {
        Linking.openURL('mailto:info@mapswipe.org');
    }, []);

    const onHandleSignoutClick = useCallback(() => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            {
                text: 'Cancel',
                style: 'cancel',
            },
            {
                text: 'OK',
                style: 'destructive',
                onPress: () => {
                    firebaseAuth.signOut().catch((error) => {
                        showAlert({
                            title: 'Sign out error',
                            message: error,
                            alertType: 'error',
                        });
                    });
                    router.replace('/');
                },
            },
        ]);
    }, [router]);

    const handleResetPasswordClick = useCallback(() => {
        Alert.alert(
            'Reset Password',
            'An email will be sent to your account with the reset link. Are you sure you want to continue?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'OK',
                    onPress: () => {
                        // auth().sendPasswordResetEmail(auth().currentUser.email);
                    },
                },
            ],
        );
    }, []);

    const handleMoreStatsClick = useCallback(() => {
        if (user?.uid) {
            Linking.openURL(`${publicDashboardUrl}/user/${user?.uid}/`);
        }
    }, [user]);

    const calendarHeatmapData = useMemo(() => {
        const contributionStats = userStatsData?.communityUserStats?.filteredStats?.swipeByDate;

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
    }, [userStatsData?.communityUserStats?.filteredStats?.swipeByDate]);

    const settingItems: ButtonLayoutProps[] = [
        {
            title: t('changeUserName'),
            onPress: onHandleChangeUsername,
        },
        {
            title: t('changePassword'),
            onPress: handleResetPasswordClick,
        },
        {
            title: t('language'),
            onPress: onHandleChangeLanguage,
            action: (
                <InlineListView
                    spacing="4xs"
                    style={styles.alignCenter}
                >
                    <Text>{currentLanguage?.name}</Text>
                    <Icon name="caret-right" size={14} />
                </InlineListView>
            ),
        },
        {
            title: t('accessibility'),
            onPress: onHandleAccessibilityChange,
            action: (
                <Switch
                    trackColor={{
                        false: theme.backgroundBrand,
                        true: theme.success,
                    }}
                    thumbColor={
                        accessibility === 'enabled'
                            ? theme.primaryBlue
                            : theme.backgroundMuted
                    }
                    value={accessibility === 'enabled'}
                    style={styles.switch}
                />
            ),
        },
        {
            title: t('signOut'),
            onPress: onHandleSignoutClick,
        },
        {
            title: 'Delete Account',
            onPress: handleLogout,
            colorVariant: 'danger',
        },
        { title: 'gap' },
        {
            title: t('mapswipeWebsite'),
            onPress: onHandleMapSwipeWebsiteClick,
            action: (
                <Icon
                    name="sign-out"
                    size={18}
                    color={theme.info}
                />),
        },
        {
            title: t('missingMaps'),
            onPress: onHandleMissingMapsClick,
            action: (
                <Icon
                    name="sign-out"
                    size={18}
                    color={theme.info}
                />),
        },
        {
            title: t('email'),
            onPress: onHandleEmailClick,
            action: <Icon name="sign-out" size={18} color={theme.info} />,
        },
    ];
    return (
        <Page title="Profile" style={styles.page} isScrollable={false}>
            <InlineListView
                style={styles.profileCard}
                withCenteredContent
                withPadding
                spacing="lg"
            >
                <Image
                    source={levelData.badge}
                    style={styles.displayPicture}
                    key={levelData.title}
                    accessibilityLabel={levelData.title}
                />
                <BlockListView
                    spacing="3xs"
                    style={styles.profileDetail}
                >
                    <Text
                        variant="title"
                        style={styles.profileDetailsText}
                    >
                        {user?.displayName}
                    </Text>
                    <Text
                        style={styles.levelText}
                    >
                        {`${t('levelX', { level })} (${levelData.title})`}
                    </Text>
                    <Bar
                        borderRadius={0}
                        borderWidth={0}
                        color={theme.primaryGreen}
                        height={10}
                        progress={progress.percentage}
                        unfilledColor={theme.backgroundMuted}
                        width={null}
                    />
                    <Text style={styles.progressText}>{levelProgressText}</Text>
                </BlockListView>
            </InlineListView>
            <ScrollView
                refreshControl={(
                    <RefreshControl
                        refreshing={loadingUserStats}
                        onRefresh={refreshPage}
                    />
                )}
            >
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
                        {userStats.map((item) => (
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
                <BlockListView
                    withPadding
                    spacing="xs"
                >
                    <Text
                        variant="title"
                    >
                        {t('settings')}
                    </Text>
                    {settingItems.map((item) => {
                        if (item.title === 'gap') {
                            return <View key={item.title} style={{ height: SPACING_MD }} />;
                        }
                        return (
                            <Button
                                name={item.title}
                                key={item.title}
                                title={item.title}
                                onPress={item.onPress}
                                action={item.action}
                                colorVariant={item.colorVariant}
                                styleVariant="block"
                            />
                        );
                    })}
                </BlockListView>
            </ScrollView>
        </Page>
    );
}

export default Profile;
