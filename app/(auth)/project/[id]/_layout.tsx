import { Stack } from 'expo-router';

function ProjectItemLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="tutorial"
                options={{
                    headerShown: true,
                    // Disable swipe-back (iOS) within the tutorial; the header
                    // back button is the intended way to leave.
                    gestureEnabled: false,
                }}
            />
            <Stack.Screen
                name="map"
                options={{
                    // Disable swipe-back (iOS) out of the mapping flow.
                    gestureEnabled: false,
                }}
            />
        </Stack>

    );
}

export default ProjectItemLayout;
