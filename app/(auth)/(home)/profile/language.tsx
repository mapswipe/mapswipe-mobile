import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';

import ClickableListItem from '@/components/ClickableListItems';
import Icon from '@/components/Icon';
import Page from '@/components/Page';
import PageHeader from '@/components/PageHeader';

const languages = [
    { code: 'en', label: 'English' },
    { code: 'ne', label: 'Nepali' },
    { code: 'hi', label: 'Hindi' },
];

export default function LanguageScreen() {
    const [selected, setSelected] = useState<string>('en');
    const router = useRouter();

    const handleSave = (code?: string) => {
        // TODO: save language to AsyncStorage or global state
        if (code) {
            console.log('Selected language:', code);
            setSelected(code);
            router.back();
        }
    };

    return (
        <Page
            title="Language"
            isScrollable={false}
        >
            <PageHeader heading="Language" />
            <ScrollView>
                {languages.map((item) => {
                    const isActive = selected === item.code;
                    return (
                        <ClickableListItem
                            name={item.code}
                            title={item.label}
                            after={isActive && <Icon name="checkmark-outline" size={16} />}
                            colorVariant="primary"
                            isActive={isActive}
                            onPress={handleSave}
                        />
                    );
                })}
            </ScrollView>
        </Page>
    );
}
