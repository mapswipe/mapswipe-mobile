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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { gql } from 'urql';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import { ButtonLayoutProps } from '@/components/ButtonLayout';
import Icon from '@/components/Icon';
import InlineListView from '@/components/InlineListView';
import Page from '@/components/Page';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileStats from '@/components/ProfileStats';
import Text from '@/components/Text';
import { showAlert } from '@/components/Toast';
import {
    mapSwipeWebUrl,
    missingMapUrl,
    supportedLanguages,
} from '@/constants/common';
import { SPACING_MD } from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import { useUserStatsQuery } from '@/generated/types/graphql';
import useAsyncHandler from '@/hooks/useAsyncHandler';
import useAuth from '@/hooks/useAuth';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseAuth } from '@/utils/firebase';

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
    const theme = useTheme();
    const { handleAsync } = useAsyncHandler();

    const [
        { data: userStatsData, fetching: loadingUserStats },
        refetchUserStats,
    ] = useUserStatsQuery({
        variables: { firebaseId: user?.uid || '' },
    });

    const currentLanguage = useMemo(
        () => (supportedLanguages ?? []).find(
            (lang: { localeCode: string }) => lang.localeCode === i18n.language,
        ),
        [i18n.language],
    );

    useEffect(() => {
        const load = async () => {
            const value = await AsyncStorage.getItem(ACCESSIBILITY_KEY);
            setAccessibility(value ?? '');
        };
        load();
    }, []);

    const refreshPage = useCallback(() => {
        refetchUserStats();
    }, [refetchUserStats]);

    const handleLogout = useCallback(() => {
        firebaseAuth.signOut();
    }, []);

    const onHandleChangeUsername = useCallback(() => {
        router.push('(auth)/changeUsername');
    }, [router]);

    const onHandleChangeLanguage = useCallback(() => {
        router.push({
            pathname: 'languageSelectionList',
            params: { isDarkBackground: String(false) },
        });
    }, [router]);

    const onHandleAccessibilityChange = useCallback(async () => {
        const newValue = accessibility === 'enabled' ? 'disabled' : 'enabled';
        await AsyncStorage.setItem(ACCESSIBILITY_KEY, newValue);
        setAccessibility(newValue);
    }, [accessibility]);

    const onHandleMissingMapsClick = useCallback(() => {
        router.push({
            pathname: '/WebviewWindow',
            params: { uri: missingMapUrl },
        });
    }, [router]);

    const onHandleMapSwipeWebsiteClick = useCallback(() => {
        router.push({
            pathname: '/WebviewWindow',
            params: { uri: mapSwipeWebUrl },
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

    const handleResetPress = useCallback(async () => {
        handleAsync(async () => {
            if (!user?.email) return;
            await sendPasswordResetEmail(firebaseAuth, user.email);
        }).then(() => {
            showAlert({
                title: t('signup:success'),
                message: t('signup:checkYourEmail'),
                alertType: 'info',
            });
        }).catch(() => {
            showAlert({
                title: t('signup:errorResetPass'),
                message: t('signup:problemResettingPassword'),
                alertType: 'error',
                shouldHideAfterDelay: false,
            });
        });
    }, [handleAsync, user, t]);

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
                    onPress: handleResetPress,
                },
            ],
        );
    }, [handleResetPress]);

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
        <Page
            title="Profile"
            style={styles.page}
            scrollable={false}
        >
            <ProfileHeader />
            <ScrollView
                refreshControl={(
                    <RefreshControl
                        refreshing={loadingUserStats}
                        onRefresh={refreshPage}
                    />
                )}
            >
                <ProfileStats
                    userStats={userStatsData}
                />
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
