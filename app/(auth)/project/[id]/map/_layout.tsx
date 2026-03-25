import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import useTheme from '@/hooks/useTheme';

export default function ProjectMapLayout() {
    const theme = useTheme();

    return (
        <>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    headerShown: true,
                    headerStyle: {
                        backgroundColor: theme.backgroundBrand,
                    },
                    headerShadowVisible: false, // removes bottom border/shadow
                    headerTintColor: theme.textOnBrand,
                    headerTitleAlign: 'center',
                    headerTitleStyle: {
                        color: theme.textOnBrand,
                    },
                }}
            />
        </>
    );
}
