import {
    useCallback,
    useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import splashScreen from '@/assets/images/splash-icon.png';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import ListRow from '@/components/ui/ListRow';
import Media from '@/components/ui/Media';
import Screen from '@/components/ui/Screen';
import { supportedLanguages } from '@/constants/common';
import { SCREEN_FRACTION } from '@/constants/size';
import useViewport from '@/hooks/useViewport';

// Untranslated: no locale bundle carries an `appName` key.
const APP_NAME = 'MapSwipe';

const CONTINUE_LABEL = 'Continue';

function LanguageSplashScreen() {
    const router = useRouter();
    const { i18n } = useTranslation();
    const viewport = useViewport();

    const currentLanguage = useMemo(
        () => (supportedLanguages ?? []).find(
            (lang: { localeCode: string }) => lang.localeCode === i18n.language,
        )?.name ?? i18n.language,
        [i18n.language],
    );

    const handleContinue = useCallback(async () => {
        await AsyncStorage.setItem('@hasSelectedLanguage', 'true');
        router.push('/onboarding');
    }, [router]);

    const handleSelection = useCallback(() => {
        router.push({
            pathname: 'languageSelectionList',
            params: { isDarkBackground: String(true) },
        });
    }, [router]);

    return (
        <Screen
            title="language"
            colorVariant="brand"
            layout="fill"
            footer={(
                <>
                    <ListRow
                        title={currentLanguage}
                        accessibilityLabel={currentLanguage}
                        iconName="globe"
                        affordance="chevron"
                        onPress={handleSelection}
                    />
                    <Button
                        title={CONTINUE_LABEL}
                        accessibilityLabel={CONTINUE_LABEL}
                        colorVariant="negative"
                        onPress={handleContinue}
                    />
                </>
            )}
        >
            <Box
                flex={1}
                align="center"
                justify="center"
            >
                {/* Sized here rather than by Media, whose spanning sizes are a fixed height. */}
                <Box
                    width={viewport.width * SCREEN_FRACTION.contentWidth}
                    height={viewport.height * SCREEN_FRACTION.heroHeight}
                >
                    <Media
                        source={splashScreen}
                        sizeVariant="fill"
                        fit="contain"
                        accessibilityLabel={APP_NAME}
                    />
                </Box>
            </Box>
        </Screen>
    );
}

export default LanguageSplashScreen;
