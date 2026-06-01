import { Stack } from 'expo-router';

function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(home)" />
            <Stack.Screen name="project" />
            <Stack.Screen
                name="exploreGroup"
            />
            <Stack.Screen
                name="changeUsername"
                options={{
                    headerShown: true,
                }}
            />
            <Stack.Screen
                name="exploreGroups"
                options={{
                    headerShown: true,
                }}
            />
        </Stack>
    );
}

export default AuthLayout;
