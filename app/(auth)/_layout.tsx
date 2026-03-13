import { Stack } from 'expo-router';

function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(home)" />
            <Stack.Screen name="project" />
            <Stack.Screen name="exploreGroup" />
            <Stack.Screen name="changeUsername" />
            <Stack.Screen name="exploreGroups" />
        </Stack>
    );
}

export default AuthLayout;
