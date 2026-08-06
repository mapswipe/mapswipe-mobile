import { type ColorVariant } from '@/constants/theme';

import Button from './Button';
import { type ButtonStyleVariant } from './ButtonLayout';
import Modal from './Modal';
import Stack from './Stack';
import Text from './Text';

/** How one of the two actions is drawn. Never chosen a side at a time: see STYLE_VARIANT. */
interface ActionTone {
    colorVariant: ColorVariant;
    styleVariant: Exclude<ButtonStyleVariant, 'underline'>;
}

/**
 * Both buttons together, because the pair is the decision: which one carries the emphasis cannot
 * be expressed by colouring one without knowing the other. `destructive` puts the eye on the
 * safe answer; `standard` emphasises the confirm and drops the cancel to an outline.
 */
const STYLE_VARIANT = {
    standard: {
        confirm: { colorVariant: 'brand', styleVariant: 'filled' },
        cancel: { colorVariant: 'brand', styleVariant: 'outline' },
    },
    destructive: {
        confirm: { colorVariant: 'negative', styleVariant: 'filled' },
        cancel: { colorVariant: 'brand', styleVariant: 'filled' },
    },
} as const satisfies Record<string, { confirm: ActionTone; cancel: ActionTone }>;

export type ConfirmDialogStyleVariant = keyof typeof STYLE_VARIANT;

export interface ConfirmDialogProps {
    style?: never;
    visible: boolean;

    title: string;
    message?: string;

    /**
     * Required and never defaulted: components/ui holds no copy, and a button should name its
     * action ("Sign out") rather than agree with a question.
     */
    confirmLabel: string;
    cancelLabel: string;

    onConfirm: () => void;
    /** Also fires on hardware back, which is a dismissal and so means the same thing. */
    onCancel: () => void;

    /**
     * Defaults to `standard`. Pass `destructive` when confirming cannot be undone: signing out,
     * deleting an account, abandoning a mapping session.
     */
    styleVariant?: ConfirmDialogStyleVariant;

    testID?: string;
}

/**
 * A yes/no sheet: a question, its consequence, and the two answers.
 *
 * Declarative rather than an imperative `showConfirm()`, because one of the app's confirmations
 * is a hand-built sheet rather than an Alert, and only a component absorbs both shapes. An OS
 * alert takes no ColorVariant, ignores the theme, and its `destructive` flag is iOS-only.
 *
 * The cost lands on the caller: this needs state saying which confirmation is pending.
 */
function ConfirmDialog(props: ConfirmDialogProps) {
    const {
        visible,
        title,
        message,
        confirmLabel,
        cancelLabel,
        onConfirm,
        onCancel,
        styleVariant = 'standard',
        testID,
    } = props;

    const { confirm, cancel } = STYLE_VARIANT[styleVariant];

    return (
        <Modal
            visible={visible}
            onClose={onCancel}
            testID={testID}
        >
            <Stack spacing="xs">
                <Stack spacing="3xs">
                    <Text variant="title">{title}</Text>
                    {message !== undefined && (
                        <Text variant="label">{message}</Text>
                    )}
                </Stack>
                {/* Cancel leads, in both variants: it is the reversible answer, and it is the
                    order the platform alert this replaces already puts them in. */}
                <Button
                    accessibilityLabel={cancelLabel}
                    title={cancelLabel}
                    colorVariant={cancel.colorVariant}
                    styleVariant={cancel.styleVariant}
                    onPress={onCancel}
                />
                <Button
                    accessibilityLabel={confirmLabel}
                    title={confirmLabel}
                    colorVariant={confirm.colorVariant}
                    styleVariant={confirm.styleVariant}
                    onPress={onConfirm}
                />
            </Stack>
        </Modal>
    );
}

export default ConfirmDialog;
