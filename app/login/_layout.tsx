import { Stack } from 'expo-router';

export default function LoginLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="login"
                options={{
                    headerShown: false,
                }}
            />
            <Stack
                screenOptions={{
                    headerShown: false,
                    title: 'LoginWithOsm',
                }}
            />
        </Stack>
    );
}
