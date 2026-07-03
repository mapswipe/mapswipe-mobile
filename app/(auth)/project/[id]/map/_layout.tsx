import { Stack } from 'expo-router';

export default function ProjectMapLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,
                // Swipe-back is left enabled so the mapping screen's
                // usePreventScreenRemove hook can intercept the iOS gesture and
                // route it through the "Stop Mapping?" confirm modal.
            }}
        />
    );
}
