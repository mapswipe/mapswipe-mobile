import 'react-native-reanimated';
import '../i18n';

import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, {
    BaseToast,
    ErrorToast,
    type ToastProps,
} from 'react-native-toast-message';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { isDefined } from '@togglecorp/fujs';
import { User } from 'firebase/auth';
import { Provider as UrqlProvider } from 'urql';

import ChangeLogModal from '@/components/ChangeLogModal';
import LoadingComponent from '@/components/Loader';
import Page from '@/components/Page';
import AuthContext, { AuthContextProps } from '@/contexts/auth';
import { fetchCsrfToken } from '@/utils/csrfToken';
import { firebaseAuth } from '@/utils/firebase';
import client from '@/utils/urqlClient';

SplashScreen.preventAutoHideAsync();

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from 'expo-router';

const styles = StyleSheet.create({
    gestureHandlerRoot: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    toastContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    toastSuccess: {
        borderLeftColor: 'green',
        height: 'auto',
    },
    toastWarning: {
        borderLeftColor: '#f4c542',
        height: 'auto',
    },
    toastError: {
        borderLeftColor: 'red',
        height: 'auto',
    },
    toastInfo: {
        borderLeftColor: 'blue',
        height: 'auto',
    },
    toastText1: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    toastText2: {
        fontSize: 14,
    },
});

export const toastConfig = {
    success: (props: ToastProps) => (
        <BaseToast
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            style={styles.toastSuccess}
            contentContainerStyle={styles.toastContainer}
            text1Style={styles.toastText1}
            text2Style={styles.toastText2}
            text2NumberOfLines={0}
        />
    ),
    warning: (props: ToastProps) => (
        <BaseToast
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            style={styles.toastWarning}
            contentContainerStyle={styles.toastContainer}
            text1Style={styles.toastText1}
            text2Style={styles.toastText2}
            text2NumberOfLines={0}
        />
    ),
    error: (props: ToastProps) => (
        <ErrorToast
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            style={styles.toastError}
            contentContainerStyle={styles.toastContainer}
            text1Style={styles.toastText1}
            text2Style={styles.toastText2}
            text2NumberOfLines={0}
        />
    ),
    info: (props: ToastProps) => (
        <BaseToast
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            style={styles.toastInfo}
            text1Style={styles.toastText1}
            text2Style={styles.toastText2}
            text2NumberOfLines={0}
        />
    ),
};

export default function AppLayout() {
    const [user, setUser] = useState<User | null | undefined>();

    useEffect(() => {
        const unSubscribe = firebaseAuth.onAuthStateChanged((authUser) => {
            setUser(authUser);
        });
        return unSubscribe;
    }, []);

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
            };
        }

        if (user === null) {
            return {
                authPending: false,
                isLoggedIn: false,
                user,
                setUser,
            };
        }

        return {
            authPending: false,
            isLoggedIn: true,
            user,
            setUser,
        };
    }, [user]);

    if (user === undefined) {
        return (
            <Page title="MapSwipe">
                <View style={styles.loadingContainer}>
                    <LoadingComponent label="Getting things ready..." />
                </View>
            </Page>
        );
    }

    const isAuthenticated = isDefined(user);

    return (
        <GestureHandlerRootView style={styles.gestureHandlerRoot}>
            <UrqlProvider value={client}>
                <AuthContext.Provider value={authContextValue}>

                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Protected guard={!isAuthenticated}>
                            <Stack.Screen name="languageSplashScreen" />
                        </Stack.Protected>
                        <Stack.Protected guard={!isAuthenticated}>
                            <Stack.Screen name="onboarding" />
                        </Stack.Protected>
                        <Stack.Protected guard={!isAuthenticated}>
                            <Stack.Screen name="login" />
                        </Stack.Protected>
                        <Stack.Protected guard={!isAuthenticated}>
                            <Stack.Screen name="register" />
                        </Stack.Protected>
                        <Stack.Protected guard={!isAuthenticated}>
                            <Stack.Screen name="forgotPassword" />
                        </Stack.Protected>
                        <Stack.Protected guard={isAuthenticated}>
                            <Stack.Screen name="(auth)" />
                        </Stack.Protected>
                        <Stack.Screen
                            name="languageSelectionList"
                            options={{ headerShown: true }}
                        />
                    </Stack>
                    <Toast config={toastConfig} />
                    <ChangeLogModal />
                </AuthContext.Provider>
            </UrqlProvider>
        </GestureHandlerRootView>
    );
}
