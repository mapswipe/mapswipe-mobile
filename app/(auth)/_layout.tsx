import { Stack } from 'expo-router';

function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(home)" />
            <Stack.Screen name="project" />
            <Stack.Screen name="exploreGroup" />
        </Stack>
    );
}

export default AuthLayout;
