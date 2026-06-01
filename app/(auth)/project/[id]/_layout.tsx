import { Stack } from 'expo-router';

function ProjectItemLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="tutorial"
                options={{
                    headerShown: true,
                }}
            />
        </Stack>

    );
}

export default ProjectItemLayout;
