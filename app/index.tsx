import Page from "@/components/Page";
import Text from "@/components/Text";
import useAuth from "@/hooks/useAuth";
import { router } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";

function AppIndex() {
    const {
        authPending,
        isLoggedIn,
    } = useAuth();

    useEffect(() => {
        if (!authPending && isLoggedIn) {
            router.replace('/projects');
        }

        if (!authPending && !isLoggedIn) {
            router.replace('/login');
        }
    }, [authPending, isLoggedIn]);

    return (
        <Page title="MapSwipe">
            <View
                style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                }}
            >
                <ActivityIndicator size="large" />
                <Text>
                    Checking user session...
                </Text>
            </View>
        </Page>
    );
}

export default AppIndex;
