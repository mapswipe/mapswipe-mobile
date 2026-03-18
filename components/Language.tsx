import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
} from 'react-native';

import ClickableListItem from '@/components/ClickableListItems';
import Icon from '@/components/Icon';
import Page from '@/components/Page';
import PageHeader from '@/components/PageHeader';
import { supportedLanguages } from '@/constants/common';
import { AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';

type LanguageProps = {
    isDarkBackground?: boolean
    onSelectLanguage?: (code: string) => void;
};

const createStyles = (
    theme: AppTheme,
    isDarkBackground: boolean,
) => StyleSheet.create({
    language: {
        backgroundColor: isDarkBackground ? theme.backgroundBrand : theme.card,
    },
});

export default function Language({ isDarkBackground, onSelectLanguage }: LanguageProps) {
    const { i18n } = useTranslation();
    const selected = i18n.language;
    const theme = useTheme();

    const styles = useThemedStyles(createStyles, isDarkBackground);

    const selectLanguage = async (code?: string) => {
        if (code) {
            await i18n.changeLanguage(code);
            if (onSelectLanguage) onSelectLanguage(code);
        }
    };

    return (
        <Page
            title="Language"
            isScrollable={false}
            variant={isDarkBackground ? 'brand' : 'normal'}
        >
            <PageHeader
                heading="Language"
            />
            <ScrollView
                style={styles.language}
            >
                {supportedLanguages.map((item) => {
                    const isActive = selected === item.localeCode;
                    return (
                        <ClickableListItem
                            key={item.code}
                            name={item.code}
                            title={item.name}
                            after={isActive && (
                                <Icon
                                    name="checkmark-outline"
                                    size={16}
                                    color={isDarkBackground
                                        ? theme.textOnPrimary : theme.textPrimary}
                                />
                            )}
                            colorVariant={isDarkBackground ? 'light' : 'primary'}
                            isActive={isActive}
                            onPress={() => selectLanguage(item.localeCode)}
                            style={styles.language}
                        />
                    );
                })}
            </ScrollView>
        </Page>
    );
}
