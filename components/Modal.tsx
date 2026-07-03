import {
    ReactNode,
    useCallback,
    useEffect,
    useState,
} from 'react';
import {
    Animated,
    Modal as NativeModal,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { isDefined } from '@togglecorp/fujs';

import {
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
} from '@/constants/dimensions';

import BlockListView from './BlockListView';
import Button from './Button';

interface Props<OPEN> {
    open: OPEN;
    visible: boolean;
    onClose?: (open: OPEN) => void;
    children: ReactNode;
    closeButtonName?: string;
    animationType?: 'slide' | 'fade' | 'none';
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
    },
    modalBox: {
        width: SCREEN_WIDTH - 50,
        maxHeight: SCREEN_HEIGHT * 0.7,
        backgroundColor: '#fff',
        borderRadius: 16,
    },
    scrollContent: {
        flexGrow: 1,
    },
});

function Modal<const OPEN>(props: Props<OPEN>) {
    const {
        open,
        visible,
        onClose,
        children,
        closeButtonName,
        animationType = 'slide',
    } = props;

    const [slideAnim] = useState(() => new Animated.Value(300));
    const [overlayOpacity] = useState(() => new Animated.Value(0));

    useEffect(() => {
        if (animationType !== 'slide') {
            return;
        }
        if (visible) {
            slideAnim.setValue(300);
            overlayOpacity.setValue(0);
            Animated.parallel([
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    tension: 80,
                    friction: 12,
                }),
            ]).start();
        } else {
            slideAnim.setValue(300);
            overlayOpacity.setValue(0);
        }
    }, [visible, animationType, slideAnim, overlayOpacity]);

    const handleClose = useCallback(() => {
        onClose?.(open);
    }, [open, onClose]);

    const isCustomSlide = animationType === 'slide';

    return (
        <NativeModal
            visible={visible}
            animationType={isCustomSlide ? 'none' : animationType}
            transparent
            onRequestClose={handleClose}
        >
            <Animated.View
                style={[styles.overlay, isCustomSlide && { opacity: overlayOpacity }]}
            >
                <Animated.View
                    style={isCustomSlide ? { transform: [{ translateY: slideAnim }] } : undefined}
                >
                    <BlockListView
                        style={styles.modalBox}
                        withPadding
                    >
                        <ScrollView contentContainerStyle={styles.scrollContent}>
                            {children}
                        </ScrollView>
                        {isDefined(onClose) && (
                            <Button
                                spacing="xs"
                                name="close"
                                styleVariant="filled"
                                onPress={handleClose}
                                title={closeButtonName ?? 'Close'}
                            />
                        )}
                    </BlockListView>
                </Animated.View>
            </Animated.View>
        </NativeModal>
    );
}

export default Modal;
