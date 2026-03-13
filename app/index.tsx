import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoadingComponent from '@/components/Loader';
import Page from '@/components/Page';
import useAuth from '@/hooks/useAuth';

function AppIndex() {
    const {
        authPending,
        isLoggedIn,
    } = useAuth();

    useEffect(() => {
        const checkNavigation = async () => {
            if (authPending) return;
            if (isLoggedIn) {
                router.replace('/projects');
                return;
            }
            try {
                const hasSeen = await AsyncStorage.getItem('@hasSeenOnboarding');
                if (hasSeen && !isLoggedIn) {
                    router.replace('/login');
                } else {
                    router.replace('/languageSplashScreen');
                }
            } catch {
                router.replace('/languageSplashScreen');
            }
        };
        checkNavigation();
    }, [authPending, isLoggedIn]);

    return (
        <Page title="MapSwipe">
            <LoadingComponent label="loading..." />
        </Page>
    );
}

export default AppIndex;
