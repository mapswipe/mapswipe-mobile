import {
    useCallback,
    useState,
} from 'react';
import {
    type Insets,
    type LayoutChangeEvent,
} from 'react-native';

import {
    HIT_SLOP_LG,
    TOUCH_TARGET_MIN,
} from '@/constants/size';

// The shortfall is shared between two opposite edges.
const HALF = 2;

// Reaches out to TOUCH_TARGET_MIN, capped: uncapped slop overlaps neighbouring controls.
function edgeInset(extent: number): number {
    const shortfall = TOUCH_TARGET_MIN - extent;

    if (shortfall <= 0) {
        return 0;
    }

    return Math.min(shortfall / HALF, HIT_SLOP_LG);
}

export interface TouchTargetSlop {
    hitSlop: Insets | undefined;
    onLayout: (event: LayoutChangeEvent) => void;
}

/**
 * Grows a control's touch area to TOUCH_TARGET_MIN without growing its box.
 *
 * Measured rather than declared: only the layout knows how tall a text target is, and slop is
 * per-axis (a full-width row is short, not narrow). A big enough target resolves to undefined,
 * which is the initial state, so React bails out without a second commit.
 */
export default function useTouchTargetSlop(): TouchTargetSlop {
    const [hitSlop, setHitSlop] = useState<Insets>();

    const onLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;

        const inline = edgeInset(width);
        const block = edgeInset(height);

        setHitSlop((current) => {
            if (inline === 0 && block === 0) {
                return undefined;
            }

            if (current?.left === inline && current?.top === block) {
                return current;
            }

            // Physical edges, and RN offers no logical spelling. It does not matter here: the
            // two inline edges always carry the same inset, so there is nothing to mirror.
            return {
                top: block,
                bottom: block,
                left: inline,
                right: inline,
            };
        });
    }, []);

    return { hitSlop, onLayout };
}
