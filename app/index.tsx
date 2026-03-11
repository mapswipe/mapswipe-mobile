import { useEffect } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';
import { router } from 'expo-router';

import Page from '@/components/Page';
import Text from '@/components/Text';
import useAuth from '@/hooks/useAuth';

const styles = StyleSheet.create({
    mainView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
});

function AppIndex() {
    const {
        authPending,
        isLoggedIn,
    } = useAuth();

    useEffect(() => {
        if (!authPending && isLoggedIn) {
            router.push('/projects');
        }

        if (!authPending && !isLoggedIn) {
            router.push('/login');
        }
    }, [authPending, isLoggedIn]);

    return (
        <Page title="MapSwipe">
            <View style={styles.mainView}>
                <ActivityIndicator size="large" />
                <Text>
                    Checking user session...
                </Text>
            </View>
        </Page>
    );
}

export default AppIndex;
