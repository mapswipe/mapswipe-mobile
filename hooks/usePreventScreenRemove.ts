import React from 'react';
import { useNavigation } from 'expo-router';
import {
    NavigationRouteContext,
    PreventRemoveContext,
} from 'expo-router/react-navigation';

interface Props {
    // When false the hook is inert (no registration, no interception). Used to
    // scope this to platforms where it applies — currently iOS, whose native
    // swipe-back is what we need to intercept. Android uses a hardware-back
    // handler instead; web browser-back doesn't fire beforeRemove at all.
    enabled?: boolean;
    // Called when a back gesture is intercepted (e.g. to open a confirm modal).
    // Must be stable (memoized) — it is a dependency of the listener effect.
    onAttemptLeave: () => void;
}

interface Result {
    // Actually leave the screen, bypassing the interception. Call after the
    // user confirms. It re-issues goBack() with a one-shot bypass so the
    // beforeRemove listener lets this navigation through.
    leave: () => void;
}

// Intercepts the iOS swipe-back gesture (and any GO_BACK/POP that would remove
// this screen) and routes it through `onAttemptLeave` instead of leaving.
// Registering with the prevent-remove context tells react-native-screens to
// defer the native dismissal to JS — without it a bare beforeRemove
// preventDefault() desyncs native-stack ("removed natively but not in JS").
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

    // Depend on the stable setPreventRemove function and route key — not the
    // whole context value (which changes identity on every prevented-route
    // change and would otherwise re-toggle this effect into an infinite loop).
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
            // Only intercept genuine back gestures/button presses. Programmatic
            // replace/reset (e.g. router.replace('/')) must not be blocked.
            if (e.data.action.type !== 'GO_BACK' && e.data.action.type !== 'POP') {
                return;
            }
            // leave() set this — allow the navigation through once.
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
