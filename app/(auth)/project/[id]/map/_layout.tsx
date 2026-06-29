import { Stack } from 'expo-router';

export default function ProjectMapLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                // Disable swipe-back (iOS) so mapping progress isn't lost to an
                // accidental edge swipe. The header back button and the Android
                // hardware back button go through the "Stop Mapping?" confirm
                // modal instead (see the mapping screen).
                gestureEnabled: false,
            }}
        />
    );
}
