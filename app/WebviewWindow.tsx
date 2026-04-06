// import {
//     getAnalytics,
//     logEvent,
// } from '@react-native-firebase/analytics';
// import { getApp } from '@react-native-firebase/app';
import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { useGlobalSearchParams } from 'expo-router';

import Page from '@/components/Page';
import useThemedStyles from '@/hooks/useThemedStyles';

type SearchParams = {
    uri?: string;
};

const createStyles = () => StyleSheet.create({
    webView: {
        flex: 1,
    },
    swipeNavTop: {
        flexWrap: 'nowrap',
    },
});

export default function WebviewWindow() {
    const { uri } = useGlobalSearchParams<SearchParams>();

    const webUri = uri ?? 'https://www.mapswipe.org/';
    const styles = useThemedStyles(createStyles);

    // useEffect(() => {
    //     const analytics = getAnalytics(getApp());
    //     logEvent(analytics, 'link_click', { uri: webUri });
    // }, [webUri]);

    return (
        <Page
            title={webUri}
            style={styles.webView}
            scrollable={false}
            showBackButton
        >
            <WebView
                javaScriptEnabled
                source={{ uri: webUri }}
            />
        </Page>
    );
}
