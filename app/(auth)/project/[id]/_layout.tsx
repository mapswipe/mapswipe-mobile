import { Stack } from 'expo-router';

function ProjectItemLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="tutorial"
                options={{
                    headerShown: true,
                    // The header back button is the only way out of the tutorial.
                    gestureEnabled: false,
                }}
            />
            {/* Swipe-back stays on: the mapping screen intercepts it. */}
            <Stack.Screen name="map" />
        </Stack>

    );
}

export default ProjectItemLayout;
