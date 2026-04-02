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
        user,
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
                const hasSelectedLanguage = await AsyncStorage.getItem('@hasSelectedLanguage');

                if (!hasSelectedLanguage) {
                    router.replace('/languageSplashScreen');
                    return;
                }

                if (!hasSeen) {
                    router.replace('/onboarding');
                    return;
                }
                router.replace('/login');
            } catch {
                router.replace('/languageSplashScreen');
            }
        };
        checkNavigation();
    }, [authPending, isLoggedIn, user]);
    return (
        <Page title="MapSwipe">
            <LoadingComponent label="loading..." />
        </Page>
    );
}

export default AppIndex;
