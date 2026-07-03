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
            {/*
              * Swipe-back is left enabled out of the mapping flow; the mapping
              * screen's usePreventScreenRemove hook intercepts the iOS gesture
              * and routes it through the "Stop Mapping?" confirm modal.
              */}
            <Stack.Screen name="map" />
        </Stack>

    );
}

export default ProjectItemLayout;
