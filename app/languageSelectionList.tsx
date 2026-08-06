import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import ListRow from '@/components/ui/ListRow';
import ListView from '@/components/ui/ListView';
import Screen from '@/components/ui/Screen';
import { supportedLanguages } from '@/constants/common';

// constants/common keeps its Language type private, so read the item type off the list.
type SupportedLanguage = (typeof supportedLanguages)[number];

function keySelector(item: SupportedLanguage): string {
    return item.code;
}

function LanguageSelectionList() {
    const { isDarkBackground } = useLocalSearchParams<{ isDarkBackground: string }>();
    const isDarkBackgroundBool = isDarkBackground === 'true';
    const router = useRouter();
    const { i18n, t } = useTranslation('mappingSession');
    const selected = i18n.language;

    const selectLanguage = useCallback(async (code?: string) => {
        if (code) {
            await i18n.changeLanguage(code);
            if (router.canGoBack()) {
                router.back();
            } else {
                router.replace('/');
            }
        }
    }, [i18n, router]);

    const renderItem = useCallback((item: SupportedLanguage) => {
        const isActive = selected === item.localeCode;
        const affordance = isActive ? 'selected' : undefined;

        // Two calls, not a ternary: styleVariant is a discriminant, so a union of both
        // variants is not assignable to either.
        if (isDarkBackgroundBool) {
            return (
                <ListRow
                    styleVariant="onBrand"
                    name={item.localeCode}
                    title={item.name}
                    accessibilityLabel={item.name}
                    affordance={affordance}
                    onPress={selectLanguage}
                />
            );
        }

        return (
            <ListRow
                name={item.localeCode}
                title={item.name}
                accessibilityLabel={item.name}
                affordance={affordance}
                onPress={selectLanguage}
            />
        );
    }, [selected, isDarkBackgroundBool, selectLanguage]);

    return (
        <Screen
            title="Language"
            colorVariant={isDarkBackgroundBool ? 'brand' : 'default'}
            withHeader
            backAccessibilityLabel={t('goBack')}
            safeArea="bottom"
            layout="fill"
        >
            <ListView
                data={supportedLanguages}
                keySelector={keySelector}
                renderItem={renderItem}
                spacing="none"
                grow="slot"
                // renderItem closes over the active locale, which the list cannot see.
                extraData={selected}
            />
        </Screen>
    );
}

export default LanguageSelectionList;
