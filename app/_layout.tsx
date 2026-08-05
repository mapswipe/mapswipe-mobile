import 'react-native-reanimated';
import '../i18n';

import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { Stack as RouterStack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { isDefined } from '@togglecorp/fujs';
import { User } from 'firebase/auth';
import { onValue } from 'firebase/database';
import { Provider as UrqlProvider } from 'urql';

import ChangeLogModal from '@/components/ChangeLogModal';
import Screen from '@/components/ui/Screen';
import Spinner from '@/components/ui/Spinner';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { toastConfig } from '@/components/ui/Toast/config';
import AuthContext, { AuthContextProps } from '@/contexts/auth';
import {
    DEFAULT_COLOR_SCHEME,
    ThemeProvider,
} from '@/contexts/theme';
import { type FbUser } from '@/firebase/functions/generated/tsfirebase/extended_models';
import { fetchCsrfToken } from '@/utils/csrfToken';
import {
    firebaseAuth,
    firebaseRef,
} from '@/utils/firebase';
import client from '@/utils/urqlClient';

SplashScreen.preventAutoHideAsync();

export {
    ErrorBoundary,
} from 'expo-router';

// Screen requires a title, but the bootstrap screen has no header, so it is never drawn.
const APP_NAME = 'MapSwipe';

const BOOTSTRAP_LABEL = 'Getting things ready...';

function AppLayout() {
    const [user, setUser] = useState<User | null | undefined>();
    const [userDetails, setUserDetails] = useState<FbUser | undefined>();
    // Tracked as a uid rather than a boolean, so no screen acts on a stale profile after login.
    const [userDetailsLoadedUid, setUserDetailsLoadedUid] = useState<string>();

    useEffect(() => {
        const unSubscribe = firebaseAuth.onAuthStateChanged((authUser) => {
            setUser(authUser);
        });
        return unSubscribe;
    }, []);

    // Kept live here so pages read teamId from AuthContext instead of each refetching it.
    useEffect(() => {
        if (!user) {
            return undefined;
        }
        const { uid } = user;
        const unsubscribe = onValue(
            firebaseRef(`v2/users/${uid}`),
            (snapshot) => {
                setUserDetails(snapshot.exists() ? snapshot.val() : undefined);
                setUserDetailsLoadedUid(uid);
            },
            (error) => {
                // eslint-disable-next-line no-console
                console.error(error);
                setUserDetailsLoadedUid(uid);
            },
        );
        return () => {
            unsubscribe();
            setUserDetails(undefined);
            setUserDetailsLoadedUid(undefined);
        };
    }, [user]);

    const userDetailsPending = isDefined(user) && user.uid !== userDetailsLoadedUid;

    useEffect(() => {
        fetchCsrfToken();
    }, []);

    useEffect(() => {
        if (user !== undefined) {
            SplashScreen.hideAsync();
        }
    }, [user]);

    const authContextValue = useMemo<AuthContextProps>(() => {
        if (user === undefined) {
            return {
                authPending: true,
                isLoggedIn: false,
                user,
                setUser,
                userDetails,
                userDetailsPending,
            };
        }

        if (user === null) {
            return {
                authPending: false,
                isLoggedIn: false,
                user,
                setUser,
                userDetails,
                userDetailsPending,
            };
        }

        return {
            authPending: false,
            isLoggedIn: true,
            user,
            setUser,
            userDetails,
            userDetailsPending,
        };
    }, [user, userDetails, userDetailsPending]);

    if (user === undefined) {
        return (
            <Screen
                title={APP_NAME}
                colorVariant="brand"
                layout="fill"
            >
                <Stack
                    spacing="sm"
                    grow="fill"
                    align="center"
                    justify="center"
                >
                    {/* Unlabelled on purpose: the line below already announces the wait. */}
                    <Spinner styleVariant="splash" />
                    <Text
                        variant="title"
                        colorVariant="onBrand"
                        weight="regular"
                    >
                        {BOOTSTRAP_LABEL}
                    </Text>
                </Stack>
            </Screen>
        );
    }

    const isAuthenticated = isDefined(user);

    return (
        <GestureHandlerRootView>
            <UrqlProvider value={client}>
                <AuthContext.Provider value={authContextValue}>

                    <RouterStack screenOptions={{ headerShown: false }}>
                        <RouterStack.Screen name="index" />
                        <RouterStack.Protected guard={!isAuthenticated}>
                            <RouterStack.Screen name="languageSplashScreen" />
                        </RouterStack.Protected>
                        <RouterStack.Protected guard={!isAuthenticated}>
                            <RouterStack.Screen name="onboarding" />
                        </RouterStack.Protected>
                        <RouterStack.Protected guard={!isAuthenticated}>
                            <RouterStack.Screen name="login" />
                        </RouterStack.Protected>
                        <RouterStack.Protected guard={!isAuthenticated}>
                            <RouterStack.Screen name="register" />
                        </RouterStack.Protected>
                        <RouterStack.Protected guard={!isAuthenticated}>
                            <RouterStack.Screen name="forgotPassword" />
                        </RouterStack.Protected>
                        <RouterStack.Protected guard={isAuthenticated}>
                            <RouterStack.Screen name="(auth)" />
                        </RouterStack.Protected>
                        <RouterStack.Screen
                            name="languageSelectionList"
                            options={{ headerShown: true }}
                        />
                    </RouterStack>
                    <Toast config={toastConfig} />
                    <ChangeLogModal />
                </AuthContext.Provider>
            </UrqlProvider>
        </GestureHandlerRootView>
    );
}

export default function RootLayout() {
    return (
        <ThemeProvider colorScheme={DEFAULT_COLOR_SCHEME}>
            <AppLayout />
        </ThemeProvider>
    );
}
