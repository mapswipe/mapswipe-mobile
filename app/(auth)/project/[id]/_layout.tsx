import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

function ProjectItemLayout() {
    return (
        <>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: true }} />
        </>
    );
}

export default ProjectItemLayout;
