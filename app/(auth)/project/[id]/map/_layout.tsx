import { Stack } from 'expo-router';

export default function ProjectMapLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                // Disable swipe-back (iOS) while mapping so progress isn't lost
                // to an accidental edge swipe; the header back / confirm modal
                // remain the intended way out.
                gestureEnabled: false,
            }}
        />
    );
}
