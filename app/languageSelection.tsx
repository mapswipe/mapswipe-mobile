import React from 'react';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import Language from '@/components/Language';

function LanguageSelection() {
    const { isDarkBackground } = useLocalSearchParams<{ isDarkBackground: string }>();
    const isDarkBackgroundBool = isDarkBackground === 'true';
    const router = useRouter();

    const selectLanguage = () => {
        router.back();
    };

    return (
        <Language
            isDarkBackground={isDarkBackgroundBool}
            onSelectLanguage={selectLanguage}
        />
    );
}

export default LanguageSelection;
