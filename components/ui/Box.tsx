import { type ReactNode } from 'react';
import {
    type AccessibilityRole,
    type LayoutChangeEvent,
    type PanResponderInstance,
    View,
    type ViewProps,
} from 'react-native';

import {
    type BoxStyleProps,
    resolveBoxStyle,
} from '@/utils/layout';

/**
 * Box is the one primitive that takes numbers. Stack and Row own token spacing; measured
 * geometry (a slot height read from onLayout, a tile width divided out of the viewport)
 * crosses the boundary here, as a number.
 */
export interface BoxProps extends BoxStyleProps {
    children?: ReactNode;

    /** Measuring is the point: this is how a view learns the geometry it then feeds back in. */
    onLayout?: (event: LayoutChangeEvent) => void;

    /**
     * The PanResponder itself, not its handler bag. PanResponderInstance has exactly one
     * member, so Box owns the spread and no style, child or stray prop can ride in on it.
     */
    panResponder?: PanResponderInstance;

    /** Anchored overlays are Box's territory, and an overlay that eats touches is a bug. */
    pointerEvents?: ViewProps['pointerEvents'];

    testID?: string;
    /** Collapses the subtree into a single accessibility node. */
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityRole?: AccessibilityRole;
}

function Box(props: BoxProps) {
    const {
        children,
        onLayout,
        panResponder,
        pointerEvents,
        testID,
        accessible,
        accessibilityLabel,
        accessibilityRole,
    } = props;

    // resolveBoxStyle reads only the BoxStyleProps keys, so the pass-throughs ride along
    // harmlessly and Box stays total over the layout surface without re-listing it.
    const style = resolveBoxStyle(props);

    return (
        <View
            style={style}
            onLayout={onLayout}
            pointerEvents={pointerEvents}
            testID={testID}
            accessible={accessible}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={accessibilityRole}
            // The only spread in the file. Its type admits nothing but responder callbacks.
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...panResponder?.panHandlers}
        >
            {children}
        </View>
    );
}

export default Box;
