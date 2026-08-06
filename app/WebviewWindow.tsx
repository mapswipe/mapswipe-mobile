// import {
//     getAnalytics,
//     logEvent,
// } from '@react-native-firebase/analytics';
// import { getApp } from '@react-native-firebase/app';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import { useGlobalSearchParams } from 'expo-router';

import Screen from '@/components/ui/Screen';

type SearchParams = {
    uri?: string;
};

export default function WebviewWindow() {
    const { uri } = useGlobalSearchParams<SearchParams>();
    const { t } = useTranslation('mappingSession');

    const webUri = uri ?? 'https://www.mapswipe.org/';

    // useEffect(() => {
    //     const analytics = getAnalytics(getApp());
    //     logEvent(analytics, 'link_click', { uri: webUri });
    // }, [webUri]);

    return (
        <Screen
            title={webUri}
            withHeader
            backAccessibilityLabel={t('goBack')}
            safeArea="bottom"
            layout="fill"
        >
            <WebView
                javaScriptEnabled
                source={{ uri: webUri }}
            />
        </Screen>
    );
}
