import { useCallback } from 'react';
import {
    Stack,
    useRouter,
} from 'expo-router';

import IconButton from '@/components/ui/IconButton';

export default function PlaygroundLayout() {
    const router = useRouter();

    const handleHomePress = useCallback(() => {
        router.push('/');
    }, [router]);

    const headerLeft = useCallback(
        () => (
            <IconButton
                name="home"
                // The glyph is kept as it was. It is an odd one for "leave the sandbox", but the
                // playground is a dev screen and swapping it is not this refactor's business.
                iconName="swipe-left"
                // Required by ui/IconButton, and it had none: an icon-only button leaves a
                // screen reader nothing to fall back on. Untranslated like the rest of the
                // playground, which ships hardcoded English copy.
                accessibilityLabel="Back to app"
                onPress={handleHomePress}
            />
        ),
        [handleHomePress],
    );

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                title: 'Playground',
                headerLeft,
            }}
        />
    );
}
