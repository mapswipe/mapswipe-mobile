import { useEffect } from 'react';
import {
    BackHandler,
    Platform,
} from 'react-native';

interface Props {
    enabled?: boolean;
    // Must be stable (memoized): it is a dependency of the effect.
    onBackPress: () => void;
}

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
            // true blocks the default back action.
            return true;
        });
        return () => subscription.remove();
    }, [enabled, onBackPress]);
}

export default useHardwareBackHandler;
