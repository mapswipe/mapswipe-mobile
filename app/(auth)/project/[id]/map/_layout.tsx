import { Stack } from 'expo-router';

export default function ProjectMapLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                // Swipe-back stays on: usePreventScreenRemove intercepts it in the session.
            }}
        />
    );
}
