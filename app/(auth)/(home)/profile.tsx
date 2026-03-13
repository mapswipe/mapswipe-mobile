import {
    useCallback,
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
import { isDefined } from '@togglecorp/fujs';
import {
    gql,
    useQuery,
} from 'urql';

import ImageSrc from '@/assets/images/icon.png';
import BlockListView from '@/components/BlockListView';
import ClickableListItem, { ClickableListItemProps } from '@/components/ClickableListItems';
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
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { getTimeSegments } from '@/utils/common';
import {
    firebaseAuth,
    firebaseRef,
} from '@/utils/firebase';

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
});

function Profile() {
    const { user } = useAuth();
    const router = useRouter();
    const styles = useThemedStyles(createStyles);
    const [isEnabledAccessibility, setIsEnabledAccessibility] = useState<boolean>(false);
    const { t, i18n } = useTranslation();

    const currentLanguage = (supportedLanguages ?? []).find(
        (lang: { code: string }) => lang.code === i18n.language,
    )?.name ?? i18n.language;

    const userDetailQuery = useMemo(() => (
        isDefined(user)
            ? firebaseRef(`v2/users/${user.uid}`)
            : undefined
    ), [user]);

    const [{ data: userStatsData, fetching: loadingUserStats }, refetchUserStats] = useQuery({
        query: USER_STATS,
        variables: { firebaseId: user ? user.uid : '' },
    });

    const refreshPage = useCallback(() => {
        refetchUserStats();
    }, [refetchUserStats]);

    const userStats: StatsInfo[] = useMemo(() => {
        const stats = userStatsData?.communityUserStats?.stats ?? {};
        const {
            totalAreaSwiped,
            totalMappingProjects,
            totalOrganization,
            totalSwipeTime,
            totalSwipes,
        } = stats;

        const totalUserGroups = userStatsData?.communityUserStats?.statsLatest?.totalUserGroups;

        // FIXME: Add Language Selected
        const formatter = new Intl.NumberFormat('en');
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
                title: ('Total swipes'),
                value: totalSwipesFormatted,
            },
            {
                title: ('Total time spent swiping'),
                value: totalSwipeTimeSegments,
            },
            {
                title: ('Total area swiped (sq.km)'),
                value: totalSwipeAreaFormatted,
            },
            {
                title: ('Total projects'),
                value: totalMappingProjectsFormatted,
            },
            {
                title: ('Organizations supported'),
                value: totalOrganizationFormatted,
            },
            {
                title: ('User groups joined'),
                value: totalUserGroupsFormatted,
            },
        ];
    }, [userStatsData]);

    const { data: userDetails } = useFirebaseDatabase<FbUser>(
        { query: userDetailQuery },
    );

    const handleLogout = useCallback(() => {
        firebaseAuth.signOut();
    }, []);

    const theme = useTheme();

    const onHandleChangeUsername = useCallback(() => {
        router.push('(auth)/changeUsername');
    }, [router]);

    const onHandleChangeLanguage = useCallback(() => {
        router.push({ pathname: 'languageSelection', params: { isDarkBackground: String(false) } });
    }, [router]);

    const onHandleExploreGroups = useCallback(() => {
        router.push('(auth)/exploreGroups');
    }, [router]);

    const onHandleAccessibilityChange = useCallback(() => {
        setIsEnabledAccessibility((prev) => !prev);
    }, []);

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
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
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
                    },
                },
            ],
        );
    }, []);

    const handleResetPasswordClick = useCallback(() => {
        Alert.alert(
            ('Reset Password'),
            'An email will be sent to your account with the reset link. Are you sure you want to continue?',
            [
                {
                    text: ('Cancel'),
                    style: 'cancel',
                },
                {
                    text: ('OK'),
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

        const contributionStatsMap = contributionStats
            .reduce((acc: Record<string, number>, val:
                { taskDate: string | number; totalSwipes: number; }) => {
                acc[val.taskDate] = val.totalSwipes;
                return acc;
            }, {});

        return contributionStatsMap;
    }, [userStatsData?.communityUserStats?.filteredStats?.swipeByDate]);

    const settingItems: ClickableListItemProps<string>[] = [
        {
            title: 'Change Username',
            onPress: onHandleChangeUsername,
        },
        {
            title: 'Reset Password',
            onPress: handleResetPasswordClick,
        },
        {
            title: 'Language',
            onPress: onHandleChangeLanguage,
            showChevronIcon: true,
            after: <Text>{currentLanguage}</Text>,
        },
        {
            title: 'Accessibility',
            after: <Switch
                trackColor={{
                    false: theme.backgroundBrand,
                    true: theme.success,
                }}
                thumbColor={
                    isEnabledAccessibility
                        ? theme.primaryBlue
                        : theme.backgroundMuted
                }
                onValueChange={onHandleAccessibilityChange}
                value={isEnabledAccessibility}
            // disabled={disabled}
            />,
        },
        {
            title: 'Sign Out',
            onPress: onHandleSignoutClick,
        },
        {
            title: 'Delete Account',
            onPress: handleLogout,
            colorVariant: 'danger',
        },
        { title: 'gap' },
        {
            title: 'MapSwipe website',
            onPress: onHandleMapSwipeWebsiteClick,
            after: <Icon
                name="sign-out"
                size={18}
                color={theme.info}
            />,
        },
        {
            title:
                'Missing Maps',
            onPress: onHandleMissingMapsClick,
            after: <Icon
                name="sign-out"
                size={18}
                color={theme.info}
            />,
        },
        {
            title:
                'Email',
            onPress: onHandleEmailClick,
            after: <Icon
                name="sign-out"
                size={18}
                color={theme.info}
            />,
        },

    ];
    return (
        <Page
            title="Profile"
            style={styles.page}
            isScrollable={false}
        >
            <InlineListView
                style={styles.profileCard}
                withCenteredContent
                withPadding
                spacing="lg"
            >
                <Image
                    source={user?.photoURL ?? ImageSrc}
                    style={styles.displayPicture}
                />
                <BlockListView
                    spacing="3xs"
                    style={styles.profileDetail}
                >
                    <Text variant="title" style={styles.profileDetailsText}>
                        {user?.displayName}
                    </Text>
                    <Text style={styles.levelText}>
                        Level 1 (Square One)
                    </Text>
                    <Bar
                        borderRadius={0}
                        borderWidth={0}
                        color={theme.primaryGreen}
                        height={10}
                        progress={0.5}
                        unfilledColor={theme.backgroundMuted}
                        width={null}
                    />
                    <Text style={styles.progressText}>
                        128 tasks (22 swipes) until the next level
                    </Text>
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
                    <Text variant="label">
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
                    <Text variant="title">
                        Contribution Heatmap (Last 30 days)
                    </Text>
                    <HeatMap activityData={calendarHeatmapData} />
                    <ClickableListItem
                        title="More Stats"
                        onPress={handleMoreStatsClick}
                        after={(
                            <Icon
                                name="sign-out"
                                size={18}
                                color={theme.info}
                            />
                        )}
                    />
                </BlockListView>
                <BlockListView
                    withPadding
                    spacing="xs"
                >
                    <Text variant="title">
                        User Groups
                    </Text>
                    <Text variant="label">
                        No groups yet
                    </Text>
                    <ClickableListItem
                        title="Explore Groups"
                        onPress={onHandleExploreGroups}
                        colorVariant="info"
                    />
                </BlockListView>
                <BlockListView
                    withPadding
                    spacing="xs"
                >
                    <Text variant="title">
                        Settings
                    </Text>
                    {settingItems.map((item) => {
                        if (item.title === 'gap') {
                            return (
                                <View
                                    key={item.title}
                                    style={{ height: SPACING_MD }}
                                />
                            );
                        }
                        return (
                            <ClickableListItem
                                key={item.title}
                                title={item.title}
                                onPress={item.onPress}
                                textSize={item.textSize}
                                showChevronIcon={item.showChevronIcon}
                                after={item.after}
                                colorVariant={item.colorVariant}
                            />
                        );
                    })}
                </BlockListView>
            </ScrollView>
        </Page>
    );
}

export default Profile;
