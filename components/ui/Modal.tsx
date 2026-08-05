import {
    type ReactNode,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    Animated,
    Modal as NativeModal,
    type ModalProps as NativeModalProps,
    ScrollView,
    type ViewStyle,
} from 'react-native';

import {
    DURATION_SLOW,
    EASING_DEFAULT,
    SHEET_TRAVEL,
    SPRING_SHEET,
} from '@/constants/motion';
import {
    OPACITY_FULL,
    OPACITY_HIDDEN,
} from '@/constants/opacity';
import {
    MODAL_INLINE_INSET,
    SCREEN_FRACTION,
} from '@/constants/size';
import useA11yPreferences from '@/hooks/useA11yPreferences';
import useViewport from '@/hooks/useViewport';
import { resolveBoxStyle } from '@/utils/layout';

import Button from './Button';
import Scrim from './Scrim';
import Spacer from './Spacer';
import Surface from './Surface';

interface ModalMotion {
    /**
     * What NativeModal animates on its own. `none` on the rung this file drives, because the
     * platform transition and the spring would otherwise both move the sheet.
     */
    native: NativeModalProps['animationType'];
    /** Whether the backdrop fade and the sheet spring below run at all. */
    driven: boolean;
}

/**
 * Driven here rather than handed to NativeModal: the platform's own `slide` moves the whole
 * window, backdrop included, where this springs the sheet over a backdrop that fades in place.
 */
const MOTION = {
    slide: { native: 'none', driven: true },
    fade: { native: 'fade', driven: false },
    none: { native: 'none', driven: false },
} as const satisfies Record<string, ModalMotion>;

export type ModalMotionType = keyof typeof MOTION;

/** Reduce motion collapses the whole axis, rather than each rung collapsing separately. */
const MOTION_REDUCED: ModalMotionType = 'none';

// Centres the sheet over a backdrop that fills the window. Resolved once: the values are
// constant, and only the animated opacity spread over them changes per render.
const OVERLAY_LAYOUT: ViewStyle = resolveBoxStyle({
    flex: 1,
    justify: 'center',
    align: 'center',
});

// Short content still fills the scroller, so a modal whose body is a single centred image looks
// the same as one whose body overflows. This is the one style the sheet cannot express as a
// prop: contentContainerStyle belongs to the scroll content, not to any box around it.
const SCROLL_CONTENT: ViewStyle = { flexGrow: 1 };

interface CommonProps {
    /** Mounted only while true. The sheet has no exit animation, so this is not a fade-out. */
    visible: boolean;
    children: ReactNode;
    /** Defaults to `slide`. Collapsed to `none` when the OS asks for reduced motion. */
    motion?: ModalMotionType;
    testID?: string;
}

export type ModalProps = CommonProps & ({
    /** Hardware back does nothing: a sheet that *is* the answer to a back press. */
    onClose?: never;
    closeLabel?: never;
} | {
    /** Fires on hardware back, and on the close button when there is one. */
    onClose: () => void;
    /**
     * The label draws the button, so a sheet with its own actions can keep back-to-dismiss and
     * no extra button. Not defaulted to "Close": components/ui holds no copy.
     */
    closeLabel?: string;
});

/**
 * The modal sheet: a card over a dimmed window, body in a scroller, optional close button under.
 *
 * The body is not a Stack: Yoga only shrinks a child when the node above has a definite
 * main-axis limit, so the scroller must be a direct child of the box carrying `maxHeight`.
 */
function Modal(props: ModalProps) {
    const {
        visible,
        children,
        motion = 'slide',
        onClose,
        closeLabel,
        testID,
    } = props;

    const viewport = useViewport();
    const { reduceMotion } = useA11yPreferences();

    // Lazy init: a bare `new Animated.Value(...)` argument would build a fresh value on every
    // render and throw all but the first away.
    const [backdropOpacity] = useState(() => new Animated.Value(OPACITY_HIDDEN));
    const [sheetOffset] = useState(() => new Animated.Value(SHEET_TRAVEL));

    const { native, driven } = MOTION[reduceMotion ? MOTION_REDUCED : motion];

    useEffect(() => {
        // Reduced motion, or a rung the platform animates: jump to the resting values and start
        // nothing. Running the same animation at zero duration is not the same thing, because a
        // zero-duration timing completes the moment it starts.
        if (!driven) {
            backdropOpacity.setValue(OPACITY_FULL);
            sheetOffset.setValue(0);
            return undefined;
        }

        backdropOpacity.setValue(OPACITY_HIDDEN);
        sheetOffset.setValue(SHEET_TRAVEL);

        if (!visible) {
            return undefined;
        }

        const entrance = Animated.parallel([
            Animated.timing(backdropOpacity, {
                toValue: OPACITY_FULL,
                duration: DURATION_SLOW,
                // Animated.timing's own implicit default, stated so that it survives a move to
                // another animation library.
                easing: EASING_DEFAULT,
                useNativeDriver: true,
            }),
            Animated.spring(sheetOffset, {
                toValue: 0,
                useNativeDriver: true,
                ...SPRING_SHEET,
            }),
        ]);

        entrance.start();

        return () => {
            entrance.stop();
        };
    }, [visible, driven, backdropOpacity, sheetOffset]);

    // Built outside the JSX: an object literal in a style prop is an inline style, and an
    // animated value cannot live in a StyleSheet.
    const overlayStyle = useMemo(() => ({
        ...OVERLAY_LAYOUT,
        opacity: backdropOpacity,
    }), [backdropOpacity]);

    const sheetStyle = useMemo(() => ({
        transform: [{ translateY: sheetOffset }],
    }), [sheetOffset]);

    // The props union already makes a label without a handler unrepresentable; destructuring
    // loses that correlation, so both are checked here.
    const withCloseButton = onClose !== undefined && closeLabel !== undefined;

    return (
        <NativeModal
            visible={visible}
            animationType={native}
            transparent
            onRequestClose={onClose}
            testID={testID}
        >
            <Animated.View style={overlayStyle}>
                <Scrim colorVariant="modal" />
                <Animated.View style={sheetStyle}>
                    <Surface
                        radius="lg"
                        padding="md"
                        width={viewport.width - MODAL_INLINE_INSET}
                        maxHeight={viewport.height * SCREEN_FRACTION.modalMaxHeight}
                    >
                        <ScrollView contentContainerStyle={SCROLL_CONTENT}>
                            {children}
                        </ScrollView>
                        {withCloseButton && (
                            <>
                                <Spacer size="md" />
                                <Button
                                    accessibilityLabel={closeLabel}
                                    title={closeLabel}
                                    onPress={onClose}
                                />
                            </>
                        )}
                    </Surface>
                </Animated.View>
            </Animated.View>
        </NativeModal>
    );
}

export default Modal;
