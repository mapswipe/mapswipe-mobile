import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import splashScreen from '@/assets/images/splash-icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Page from '@/components/Page';
import { supportedLanguages } from '@/constants/common';
import {
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
} from '@/constants/dimensions';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = () => StyleSheet.create({
    mainContent: {
        width: SCREEN_WIDTH,
        height: '100%',
        justifyContent: 'space-between',
    },
    icon: {
        resizeMode: 'contain',
        height: SCREEN_HEIGHT * 0.3,
        width: SCREEN_WIDTH * 0.8,

    },
    iconContainer: {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },

});

function LanguageSplashScreen() {
    const router = useRouter();
    const { i18n } = useTranslation();
    const currentLanguage = (supportedLanguages ?? []).find(
        (lang: { localeCode: string }) => lang.localeCode === i18n.language,
    )?.name ?? i18n.language;

    const styles = useThemedStyles(createStyles);

    const handleContinue = useCallback(async () => {
        await AsyncStorage.setItem('@hasSelectedLanguage', 'true');
        router.push('/onboarding');
    }, [router]);

    const handleSelection = useCallback(() => {
        router.push({ pathname: 'languageSelection', params: { isDarkBackground: String(true) } });
    }, [router]);

    return (
        <Page
            title="language"
            isScrollable={false}
            variant="brand"
        >
            <BlockListView
                style={styles.mainContent}
                withPadding
            >
                <View
                    style={styles.iconContainer}
                >
                    <Image
                        style={styles.icon}
                        source={splashScreen}
                    />
                </View>
                <BlockListView>
                    <Button
                        name={undefined}
                        title={currentLanguage}
                        iconName="globe"
                        styleVariant="block"
                        action={<Icon name="caret-right" size={18} />}
                        onPress={handleSelection}
                    />
                    <Button
                        name="continue"
                        title="Continue"
                        colorVariant="primaryRed"
                        styleVariant="filled"
                        onPress={handleContinue}
                    />
                </BlockListView>
            </BlockListView>
        </Page>
    );
}

export default LanguageSplashScreen;
