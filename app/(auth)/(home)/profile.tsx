import {
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    deleteUser,
    sendPasswordResetEmail,
} from 'firebase/auth';
import {
    CombinedError,
    gql,
} from 'urql';

import { ACCESSIBILITY_TUTORIAL_SEEN_KEY } from '@/components/AccessibilityInfoModal';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import { ButtonLayoutProps } from '@/components/ButtonLayout';
import Icon from '@/components/Icon';
import InlineListView from '@/components/InlineListView';
import Page from '@/components/Page';
import ProfileHeader from '@/components/ProfileHeader';
import ProfileStats from '@/components/ProfileStats';
import showConfirm from '@/components/showConfirm';
import Text from '@/components/Text';
import { showAlert } from '@/components/Toast';
import {
    gqlEndpoint,
    mapSwipeWebUrl,
    missingMapUrl,
    referrerEndpoint,
    supportedLanguages,
} from '@/constants/common';
import { SPACING_MD } from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import { useUserStatsQuery } from '@/generated/types/graphql';
import useAccessibility from '@/hooks/useAccessibility';
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

// Turn a urql error into a clear, user-facing reason: CSRF, a network failure,
// or the actual error message the server returned.
function describeStatsError(error: CombinedError): { title: string; message: string } {
    const status = (error.response as { status?: number } | undefined)?.status;
    const graphQLMessage = error.graphQLErrors
        ?.map((graphQLError) => graphQLError.message)
        .filter(Boolean)
        .join('\n');
    const networkMessage = error.networkError?.message;
    const haystack = `${error.message} ${networkMessage ?? ''} ${graphQLMessage ?? ''}`
        .toLowerCase();

    if (status === 403 || haystack.includes('csrf')) {
        return {
            title: 'CSRF issue',
            message: graphQLMessage
                || networkMessage
                || 'Your session/CSRF token is missing or invalid. Try signing in again.',
        };
    }

    // The server responded with a real GraphQL error — surface it verbatim.
    if (graphQLMessage) {
        return {
            title: 'Could not load stats',
            message: graphQLMessage,
        };
    }

    // Non-2xx HTTP response without a GraphQL body.
    if (typeof status === 'number') {
        return {
            title: `Server error (${status})`,
            message: networkMessage || 'The stats server returned an error.',
        };
    }

    // fetch rejected — never reached the server (offline / DNS / CORS).
    if (error.networkError) {
        return {
            title: 'Network issue',
            message: 'Could not reach the stats server. Check your connection and try again.',
        };
    }

    return {
        title: 'Could not load stats',
        message: error.message || 'Something went wrong while loading your stats.',
    };
}

const createStyles = (theme: AppTheme) => StyleSheet.create({
    scrollView: {
        backgroundColor: theme.backgroundMuted,
    },
    alignCenter: {
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: theme.primaryBlue,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: theme.primaryBlue,
    },
});

function Profile() {
    const { user } = useAuth();
    const { currentUser } = firebaseAuth;
    const router = useRouter();
    const styles = useThemedStyles(createStyles);
    const { isAccessibilityEnabled, setAccessibility } = useAccessibility();
    const { t, i18n } = useTranslation('profileScreen');
    const theme = useTheme();
    // FIXME: Update the use of this function
    const { handleAsync } = useAsyncHandler();

    const [
        { data: userStatsData, fetching: loadingUserStats, error: userStatsError },
        refetchUserStats,
    ] = useUserStatsQuery({
        variables: { firebaseId: user?.uid ?? '' },
        // Don't query with an empty id before auth resolves — an empty
        // firebaseId returns "No ContributorUser matches the given query."
        pause: !user?.uid,
    });

    // Surface stats-fetch failures clearly (CSRF / network / real server error)
    // instead of silently rendering zeros.
    useEffect(() => {
        if (!userStatsError) {
            return;
        }
        const { title, message } = describeStatsError(userStatsError);
        // TEMP (this deployment only): append request context so QA reports are
        // actionable. Remove once the stats issue is resolved.
        const diagnostics = [
            `firebaseId: ${user?.uid ?? '(none)'}`,
            `backend: ${gqlEndpoint}`,
            `referrer: ${referrerEndpoint ?? '(unset)'}`,
        ].join('\n');
        showAlert({
            title,
            message: `${message}\n\n${diagnostics}`,
            alertType: 'error',
            shouldHideAfterDelay: false,
        });
    }, [userStatsError, user?.uid]);

    const currentLanguage = useMemo(
        () => (supportedLanguages ?? []).find(
            (lang: { localeCode: string }) => lang.localeCode === i18n.language,
        ),
        [i18n.language],
    );

    const refreshPage = useCallback(() => {
        refetchUserStats();
    }, [refetchUserStats]);

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
        try {
            await setAccessibility(!isAccessibilityEnabled);
            await AsyncStorage.removeItem(ACCESSIBILITY_TUTORIAL_SEEN_KEY);
            showAlert({
                title: 'Accessibility updated',
                message: isAccessibilityEnabled ? 'Accessibility mode disabled.' : 'Accessibility mode enabled.',
                alertType: 'success',
            });
        } catch {
            showAlert({
                title: 'Update failed',
                message: 'Could not update accessibility setting. Please try again.',
                alertType: 'error',
                shouldHideAfterDelay: false,
            });
        }
    }, [isAccessibilityEnabled, setAccessibility]);

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
        showConfirm({
            title: 'Sign Out',
            message: 'Are you sure you want to sign out?',
            onConfirm: () => {
                firebaseAuth.signOut().catch((error) => {
                    showAlert({
                        title: 'Sign out error',
                        message: error,
                        alertType: 'error',
                    });
                });
                router.replace('/');
            },
            destructive: true,
        });
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

    const handleDelete = useCallback(async () => {
        if (!currentUser) return;
        try {
            await deleteUser(currentUser);
            showAlert({
                title: t('accountDeleted'),
                message: t('accountDeletedSuccessMessage'),
                alertType: 'info',
            });
            router.replace('/login');
        } catch {
            showAlert({
                title: t('accountDeletionFailed'),
                message: t('accountDeletionFailedMessage'),
                alertType: 'error',
            });
        }
    }, [currentUser, t, router]);

    const handleResetPasswordClick = useCallback(() => {
        showConfirm({
            title: 'Reset Password',
            message: 'An email will be sent to your account with the reset link. Are you sure you want to continue?',
            onConfirm: handleResetPress,
        });
    }, [handleResetPress]);

    const handleDeleteAccountClick = useCallback(() => {
        showConfirm({
            title: t('deleteAccountQuestion'),
            message: t(
                'Are you sure you want to delete you account? This action cannot be undone!',
            ),
            onConfirm: handleDelete,
        });
    }, [handleDelete, t]);

    const isOsmUser = user?.uid?.startsWith('osm:') ?? false;

    const settingItems: ButtonLayoutProps[] = [
        ...(!isOsmUser ? [{
            title: t('changeUserName'),
            onPress: onHandleChangeUsername,
        }] : []),
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
                <View
                    style={[
                        styles.checkbox,
                        isAccessibilityEnabled && styles.checkboxChecked,
                    ]}
                >
                    {isAccessibilityEnabled && (
                        <Icon
                            name="checkmark-outline"
                            color={theme.card}
                            size={14}
                        />
                    )}
                </View>
            ),
        },
        {
            title: t('signOut'),
            onPress: onHandleSignoutClick,
        },
        {
            title: 'Delete Account',
            onPress: handleDeleteAccountClick,
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
            variant="brand"
            scrollable={false}
        >
            <ProfileHeader />
            <ScrollView
                style={styles.scrollView}
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
