import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import { AccessibilityInfo } from 'react-native';

interface Result {
    reduceMotion: boolean;
}

function useA11yPreferences(): Result {
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        let active = true;

        // The query rejects when the native module is missing, so swallow it and keep `false`.
        AccessibilityInfo.isReduceMotionEnabled().then(
            (enabled) => {
                if (active) {
                    setReduceMotion(enabled);
                }
            },
            () => undefined,
        );

        const subscription = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            setReduceMotion,
        );

        return () => {
            active = false;
            subscription.remove();
        };
    }, []);

    return useMemo(() => ({ reduceMotion }), [reduceMotion]);
}

export default useA11yPreferences;
