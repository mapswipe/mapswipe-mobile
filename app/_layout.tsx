import 'react-native-reanimated';
import '../i18n.ts';

import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast, {
    BaseToast,
    ErrorToast,
    type ToastProps,
} from 'react-native-toast-message';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { isDefined } from '@togglecorp/fujs';
import { User } from 'firebase/auth';
import { Provider as UrqlProvider } from 'urql';

import Page from '@/components/Page';
import Text from '@/components/Text';
import AuthContext, { AuthContextProps } from '@/contexts/auth';
import useTheme from '@/hooks/useTheme';
import { fetchCsrfToken } from '@/utils/csrfToken';
import { firebaseAuth } from '@/utils/firebase';
import client from '@/utils/urqlClient';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from 'expo-router';

export const toastConfig = {
    success: (props: ToastProps) => (
        <BaseToast
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            style={{ borderLeftColor: 'green' }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            text1Style={{ fontSize: 16, fontWeight: 'bold' }}
            text2Style={{ fontSize: 14 }}
        />
    ),
    warning: (props: ToastProps) => (
        <BaseToast
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            style={{ borderLeftColor: '#f4c542' }}
            contentContainerStyle={{ paddingHorizontal: 15 }}
            text1Style={{ fontSize: 16, fontWeight: 'bold' }}
            text2Style={{ fontSize: 14 }}
        />
    ),
    error: (props: ToastProps) => (
        <ErrorToast
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            text1Style={{ fontSize: 16, fontWeight: 'bold' }}
            text2Style={{ fontSize: 14 }}
        />
    ),
    info: (props: ToastProps) => (
        <BaseToast
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            style={{ borderLeftColor: 'blue' }}
            text1Style={{ fontSize: 16, fontWeight: 'bold' }}
            text2Style={{ fontSize: 14 }}
        />
    ),
};

export default function AppLayout() {
    const theme = useTheme();
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
                <View
                    style={{
                        flex: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                    }}
                >
                    <ActivityIndicator size="large" />
                    <Text>
                        Getting things ready...
                    </Text>
                </View>
            </Page>
        );
    }

    const isAuthenticated = isDefined(user);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <UrqlProvider value={client}>
            <AuthContext.Provider value={authContextValue}>
                    <StatusBar
                    backgroundColor={theme.primaryBlue}
                    translucent={false}
                    style="light"
                />
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Protected guard={!isAuthenticated}>
                            <Stack.Screen name="login" />
                        </Stack.Protected>
                        <Stack.Protected guard={isAuthenticated}>
                            <Stack.Screen name="(auth)" />
                        </Stack.Protected>
                    </Stack>
                    <Toast config={toastConfig} />
                </AuthContext.Provider>
        </UrqlProvider>
        </GestureHandlerRootView>
    );
}
