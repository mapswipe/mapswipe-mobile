import { useEffect } from 'react';
import {
    BackHandler,
    Platform,
} from 'react-native';

interface Props {
    // When false the handler is detached and the default back behaviour applies.
    enabled?: boolean;
    // Called when the Android hardware back button is pressed while enabled.
    // The default back navigation is blocked while enabled, so this handler
    // decides what happens next (e.g. show a confirm modal). Must be stable
    // (memoized) — it is a dependency of the effect.
    onBackPress: () => void;
}

// Intercepts the Android hardware back button for the current screen and routes
// it through `onBackPress` instead of navigating away. No-op on iOS / web,
// which have no hardware back button.
function useHardwareBackHandler(props: Props) {
    const {
        enabled = true,
        onBackPress,
    } = props;

    useEffect(() => {
        if (!enabled || Platform.OS !== 'android') {
            return undefined;
        }
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            onBackPress();
            // Returning true blocks the default back action so the screen isn't
            // dismissed before the user confirms.
            return true;
        });
        return () => subscription.remove();
    }, [enabled, onBackPress]);
}

export default useHardwareBackHandler;
