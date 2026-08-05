import {
    useCallback,
    useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    deleteUser,
    sendPasswordResetEmail,
} from 'firebase/auth';
import { gql } from 'urql';

import { ACCESSIBILITY_TUTORIAL_SEEN_KEY } from '@/components/AccessibilityInfoModal';
import ProfileHeader from '@/components/domain/ProfileHeader';
import ProfileStats from '@/components/domain/ProfileStats';
import showConfirm from '@/components/showConfirm';
import { showAlert } from '@/components/Toast';
import Box from '@/components/ui/Box';
import Checkbox from '@/components/ui/Checkbox';
import ListRow from '@/components/ui/ListRow';
import ListView from '@/components/ui/ListView';
import Screen from '@/components/ui/Screen';
import Section from '@/components/ui/Section';
import Spacer from '@/components/ui/Spacer';
import Surface from '@/components/ui/Surface';
import {
    mapSwipeWebUrl,
    missingMapUrl,
    supportedLanguages,
} from '@/constants/common';
import { useUserStatsQuery } from '@/generated/types/graphql';
import useAnswerBadgesEnabled from '@/hooks/useAnswerBadgesEnabled';
import useAsyncHandler from '@/hooks/useAsyncHandler';
import useAuth from '@/hooks/useAuth';
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

// ListView is the only scroll container with pull-to-refresh, so the body rides in its slots.
const NO_ROWS: readonly never[] = [];

function selectNoKey(): string {
    return '';
}

function renderNoRow(): null {
    return null;
}

function Profile() {
    const { user } = useAuth();
    const { currentUser } = firebaseAuth;
    const router = useRouter();
    const { isAnswerBadgesEnabled, setAnswerBadgesEnabled } = useAnswerBadgesEnabled();
    const { t, i18n } = useTranslation('profileScreen');
    // FIXME: Update the use of this function
    const { handleAsync } = useAsyncHandler();

    const [
        { data: userStatsData, fetching: loadingUserStats },
        refetchUserStats,
    ] = useUserStatsQuery({
        variables: { firebaseId: user?.uid ?? '' },
        // An empty firebaseId errors out, so wait for auth to resolve.
        pause: !user?.uid,
    });

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
            await setAnswerBadgesEnabled(!isAnswerBadgesEnabled);
            await AsyncStorage.removeItem(ACCESSIBILITY_TUTORIAL_SEEN_KEY);
            showAlert({
                title: 'Accessibility updated',
                message: isAnswerBadgesEnabled ? 'Accessibility mode disabled.' : 'Accessibility mode enabled.',
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
    }, [isAnswerBadgesEnabled, setAnswerBadgesEnabled]);

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

    const settings = (
        <Section
            title={t('settings')}
            withPadding
        >
            {!isOsmUser && (
                <ListRow
                    title={t('changeUserName')}
                    accessibilityLabel={t('changeUserName')}
                    onPress={onHandleChangeUsername}
                />
            )}
            <ListRow
                title={t('changePassword')}
                accessibilityLabel={t('changePassword')}
                onPress={handleResetPasswordClick}
            />
            <ListRow
                title={t('language')}
                accessibilityLabel={t('language')}
                value={currentLanguage?.name}
                affordance="chevron"
                onPress={onHandleChangeLanguage}
            />
            <ListRow
                title={t('accessibility')}
                accessibilityLabel={t('accessibility')}
                onPress={onHandleAccessibilityChange}
            >
                {/* No onChange: the row owns the press and the checkbox is a read-only
                    indicator. */}
                <Checkbox
                    checked={isAnswerBadgesEnabled}
                    colorVariant="brand"
                />
            </ListRow>
            <ListRow
                title={t('signOut')}
                accessibilityLabel={t('signOut')}
                onPress={onHandleSignoutClick}
            />
            <ListRow
                title="Delete Account"
                accessibilityLabel="Delete Account"
                colorVariant="negative"
                onPress={handleDeleteAccountClick}
            />
            <Spacer size="md" />
            <ListRow
                title={t('mapswipeWebsite')}
                accessibilityLabel={t('mapswipeWebsite')}
                affordance="external"
                onPress={onHandleMapSwipeWebsiteClick}
            />
            <ListRow
                title={t('missingMaps')}
                accessibilityLabel={t('missingMaps')}
                affordance="external"
                onPress={onHandleMissingMapsClick}
            />
            <ListRow
                title={t('email')}
                accessibilityLabel={t('email')}
                affordance="external"
                onPress={onHandleEmailClick}
            />
        </Section>
    );

    return (
        <Screen
            title="Profile"
            colorVariant="brand"
            layout="fill"
            hero={(
                // The wrapper stops ProfileHeader's growing list from taking half the window.
                <Box>
                    <ProfileHeader />
                </Box>
            )}
        >
            {/* Painted, not transparent: the page behind is brand navy and the card text would
                vanish into it. */}
            <Surface
                colorVariant="sunken"
                flex="fill"
            >
                <ListView
                    data={NO_ROWS}
                    keySelector={selectNoKey}
                    renderItem={renderNoRow}
                    spacing="none"
                    grow="slot"
                    header={<ProfileStats userStats={userStatsData} />}
                    footer={settings}
                    onRefresh={refreshPage}
                    refreshing={loadingUserStats}
                />
            </Surface>
        </Screen>
    );
}

export default Profile;
