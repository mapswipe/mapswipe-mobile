import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Page from '@/components/Page';
import { supportedLanguages } from '@/constants/common';
import { AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = (
    theme: AppTheme,
    isDarkBackground: boolean,
) => StyleSheet.create({
    language: {
        backgroundColor: isDarkBackground ? theme.backgroundBrand : theme.card,
    },
});

function LanguageSelectionList() {
    const { isDarkBackground } = useLocalSearchParams<{ isDarkBackground: string }>();
    const isDarkBackgroundBool = isDarkBackground === 'true';
    const router = useRouter();
    const { i18n } = useTranslation();
    const selected = i18n.language;
    const theme = useTheme();

    const styles = useThemedStyles(createStyles, isDarkBackgroundBool);

    const selectLanguage = async (code?: string) => {
        if (code) {
            await i18n.changeLanguage(code);
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        }
    };

    return (
        <Page
            title="Language"
            variant={isDarkBackgroundBool ? 'brand' : 'normal'}
            showBackButton
        >
            <BlockListView
                style={styles.language}
                spacing="none"
            >
                {supportedLanguages.map((item) => {
                    const isActive = selected === item.localeCode;
                    return (
                        <Button
                            key={item.code}
                            name={item.code}
                            title={item.name}
                            action={isActive && (
                                <Icon
                                    name="checkmark-outline"
                                    size={16}
                                    color={isDarkBackgroundBool
                                        ? theme.textOnPrimary : theme.textPrimary}
                                />
                            )}
                            colorVariant={isDarkBackgroundBool ? 'white' : 'primaryBlue'}
                            styleVariant="block"
                            onPress={() => selectLanguage(item.localeCode)}
                            style={styles.language}
                        />
                    );
                })}
            </BlockListView>
        </Page>
    );
}

export default LanguageSelectionList;
