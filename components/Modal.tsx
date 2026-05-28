import {
    ReactNode,
    useCallback,
} from 'react';
import {
    Modal as NativeModal,
    StyleSheet,
    View,
} from 'react-native';

import BlockListView from './BlockListView';
import Button from './Button';

interface Props<OPEN> {
    open: OPEN;
    visible: boolean;
    onClose?: (open: OPEN) => void;
    children: ReactNode;
    closeButtonName?: string
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBox: {
        width: '80%',
        minHeight: '40%',
        backgroundColor: '#fff',
        borderRadius: 16,
        justifyContent: 'space-between',
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
                    {children}
                    <Button
                        name="close"
                        styleVariant="filled"
                        onPress={handleClose}
                        title={closeButtonName ?? 'Close'}
                    />
                </BlockListView>
            </View>
        </NativeModal>
    );
}

export default Modal;
