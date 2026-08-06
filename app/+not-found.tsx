import { useCallback } from 'react';
import { useRouter } from 'expo-router';

import EmptyState from '@/components/ui/EmptyState';
import Screen from '@/components/ui/Screen';

const TITLE = 'Oops!';
const MESSAGE = 'This screen does not exist.';
const HOME_LABEL = 'Go to home screen';

export default function NotFoundScreen() {
    const router = useRouter();

    const handleGoHome = useCallback(() => {
        router.replace('/');
    }, [router]);

    return (
        <Screen
            title={TITLE}
            layout="centered"
        >
            <EmptyState
                sizeVariant="page"
                iconName="question-mark"
                title={MESSAGE}
                actionLabel={HOME_LABEL}
                actionAccessibilityLabel={HOME_LABEL}
                onActionPress={handleGoHome}
            />
        </Screen>
    );
}
