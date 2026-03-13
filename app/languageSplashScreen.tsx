import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import splashScreen from '@/assets/images/splash-icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import ClickableListItem from '@/components/ClickableListItems';
import Icon from '@/components/Icon';
import { supportedLanguages } from '@/constants/common';
import {
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
} from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    mainContent: {
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        justifyContent: 'space-between',
        backgroundColor: theme.backgroundBrand,
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
    },

});

function LanguageSplashScreen() {
    const router = useRouter();
    const { i18n } = useTranslation();
    const currentLanguage = (supportedLanguages ?? []).find(
        (lang: { localeCode: string }) => lang.localeCode === i18n.language,
    )?.name ?? i18n.language;

    const styles = useThemedStyles(createStyles);

    const handleContinue = useCallback(() => (router.push('/onboarding')), [router]);
    const handleSelection = useCallback(() => {
        router.push({ pathname: 'languageSelection', params: { isDarkBackground: String(true) } });
    }, [router]);

    return (
        <BlockListView
            style={styles.mainContent}
            withPadding
            spacing="4xl"
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
                <ClickableListItem
                    title={currentLanguage}
                    showChevronIcon
                    before={<Icon name="globe" />}
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
    );
}

export default LanguageSplashScreen;
