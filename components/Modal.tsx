import {
    type ReactNode,
    useCallback,
} from 'react';

import Modal, { type ModalMotionType } from '@/components/ui/Modal';

/**
 * What this component put on the close button when a caller named nothing. ui/Modal refuses to
 * default it (components/ui holds no copy), so the fallback stays here, with the callers that
 * still rely on it.
 */
const DEFAULT_CLOSE_LABEL = 'Close';

interface Props<OPEN> {
    /**
     * Handed back to `onClose`, so one handler can serve several sheets. ui/Modal dropped it:
     * its handler takes no argument, and the payload is bound here instead.
     */
    open: OPEN;
    visible: boolean;
    onClose?: (open: OPEN) => void;
    children: ReactNode;
    closeButtonName?: string;
    animationType?: ModalMotionType;
}

function LegacyModal<const OPEN>(props: Props<OPEN>) {
    const {
        open,
        visible,
        onClose,
        children,
        closeButtonName,
        animationType = 'slide',
    } = props;

    const handleClose = useCallback(() => {
        onClose?.(open);
    }, [open, onClose]);

    // Two branches rather than one element with conditional props: ui/Modal's union closes
    // `closeLabel` off on a sheet with no handler, and a spread would defeat that check.
    if (onClose === undefined) {
        return (
            <Modal
                visible={visible}
                motion={animationType}
            >
                {children}
            </Modal>
        );
    }

    return (
        <Modal
            visible={visible}
            motion={animationType}
            onClose={handleClose}
            closeLabel={closeButtonName ?? DEFAULT_CLOSE_LABEL}
        >
            {children}
        </Modal>
    );
}

export default LegacyModal;
