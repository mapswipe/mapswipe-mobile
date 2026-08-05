import React from 'react';
import { useNavigation } from 'expo-router';
import {
    NavigationRouteContext,
    PreventRemoveContext,
} from 'expo-router/react-navigation';

interface Props {
    // Only iOS has a native swipe-back to intercept; Android uses a hardware-back
    // handler, and web browser-back never fires beforeRemove.
    enabled?: boolean;
    // Must be stable (memoized): it is a dependency of the listener effect.
    onAttemptLeave: () => void;
}

interface Result {
    leave: () => void;
}

// Registering with the prevent-remove context is required: a bare beforeRemove
// preventDefault() desyncs react-native-screens' native stack.
function usePreventScreenRemove(props: Props): Result {
    const {
        enabled = true,
        onAttemptLeave,
    } = props;

    const navigation = useNavigation();
    const route = React.useContext(NavigationRouteContext);
    const preventRemoveContext = React.useContext(PreventRemoveContext);
    const id = React.useId();
    // One-shot flag set by leave() so the resulting goBack() isn't intercepted.
    const bypassRef = React.useRef(false);

    // Depend on these, not the whole context: its identity changes on every prevented route.
    const setPreventRemove = preventRemoveContext?.setPreventRemove;
    const routeKey = route?.key;

    React.useEffect(() => {
        if (!enabled || !setPreventRemove || !routeKey) {
            return undefined;
        }
        setPreventRemove(id, routeKey, true);
        return () => setPreventRemove(id, routeKey, false);
    }, [enabled, setPreventRemove, routeKey, id]);

    React.useEffect(() => {
        if (!enabled) {
            return undefined;
        }
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            // Programmatic replace/reset (e.g. router.replace('/')) must not be blocked.
            if (e.data.action.type !== 'GO_BACK' && e.data.action.type !== 'POP') {
                return;
            }
            if (bypassRef.current) {
                bypassRef.current = false;
                return;
            }
            e.preventDefault();
            onAttemptLeave();
        });

        return unsubscribe;
    }, [enabled, navigation, onAttemptLeave]);

    const leave = React.useCallback(() => {
        bypassRef.current = true;
        navigation.goBack();
    }, [navigation]);

    return { leave };
}

export default usePreventScreenRemove;
