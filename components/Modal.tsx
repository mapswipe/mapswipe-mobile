import {
    ReactNode,
    useCallback,
} from 'react';
import {
    Modal as NativeModal,
    ScrollView,
    StyleSheet,
    View,
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
    } = props;

    const handleClose = useCallback(() => {
        onClose?.(open);
    }, [open, onClose]);

    return (
        <NativeModal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
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
            </View>
        </NativeModal>
    );
}

export default Modal;
