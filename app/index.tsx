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
                router.push('/projects');
            }
            try {
                const hasSeen = await AsyncStorage.getItem('@hasSeenOnboarding');
                if (hasSeen && !isLoggedIn) {
                    router.replace('/login');
                } else {
                    router.replace('/onboarding');
                }
            } catch {
                router.replace('/onboarding');
            }
        };

        checkNavigation();
    }, [authPending, isLoggedIn]);

    return (
        <Page title="MapSwipe">
            <LoadingComponent label="Getting things ready..." />
        </Page>
    );
}

export default AppIndex;
