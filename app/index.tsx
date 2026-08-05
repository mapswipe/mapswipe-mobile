import { useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Screen from '@/components/ui/Screen';
import Spinner from '@/components/ui/Spinner';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import useAuth from '@/hooks/useAuth';

// Screen requires a title, but this screen has no header, so it is never drawn.
const APP_NAME = 'MapSwipe';

const LOADING_LABEL = 'loading...';

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
                    {LOADING_LABEL}
                </Text>
            </Stack>
        </Screen>
    );
}

export default AppIndex;
