import { Pressable } from 'react-native';
import {
    Stack,
    useRouter,
} from 'expo-router';

import Icon from '@/components/Icon';

export default function PlaygroundLayout() {
    const router = useRouter();

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                title: 'Playground',
                // eslint-disable-next-line react/no-unstable-nested-components
                headerLeft: () => (
                    <Pressable onPress={() => router.replace('/')}>
                        <Icon name="swipe-left" />
                    </Pressable>
                ),
            }}
        />
    );
}
