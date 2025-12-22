import { useEffect, useMemo, useState } from 'react';
import { isDefined } from '@togglecorp/fujs';
import 'react-native-reanimated';
import { User } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { firebaseAuth } from '@/utils/firebase';
import AuthContext, { AuthContextProps } from '@/contexts/auth';
import { Stack } from 'expo-router';
import Page from '@/components/Page';
import { ActivityIndicator, View } from 'react-native';
import Text from '@/components/Text';

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
            }
        }

        if (user === null) {
            return {
                authPending: false,
                isLoggedIn: false,
                user,
            }
        }

        return {
            authPending: false,
            isLoggedIn: true,
            user,
        }
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
