import 'react-native-reanimated';

import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    View,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { isDefined } from '@togglecorp/fujs';
import { User } from 'firebase/auth';

import Page from '@/components/Page';
import Text from '@/components/Text';
import AuthContext, { AuthContextProps } from '@/contexts/auth';
import { firebaseAuth } from '@/utils/firebase';

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary,
} from 'expo-router';

export default function AppLayout() {
    const [user, setUser] = useState<User | null | undefined>();

    useEffect(() => {
        const unSubscribe = firebaseAuth.onAuthStateChanged((authUser) => {
            setUser(authUser);
        });

        return unSubscribe;
    }, []);

    const authContextValue = useMemo<AuthContextProps>(() => {
        if (user === undefined) {
            return {
                authPending: true,
                isLoggedIn: false,
                user,
            };
        }

        if (user === null) {
            return {
                authPending: false,
                isLoggedIn: false,
                user,
            };
        }

        return {
            authPending: false,
            isLoggedIn: true,
            user,
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
        <AuthContext.Provider value={authContextValue}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Protected guard={!isAuthenticated}>
                    <Stack.Screen name="login" />
                </Stack.Protected>
                <Stack.Protected guard={isAuthenticated}>
                    <Stack.Screen name="(auth)" />
                </Stack.Protected>
            </Stack>
        </AuthContext.Provider>
    );
}
