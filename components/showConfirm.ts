import {
    Alert,
    Platform,
} from 'react-native';

type ConfirmOptions = {
    title: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
};

export default function showConfirm({
    title,
    message,
    confirmText = 'OK',
    cancelText = 'Cancel',
    destructive = false,
    onConfirm,
    onCancel,
}: ConfirmOptions) {
    if (Platform.OS === 'web') {
        const text = message ? `${title}\n\n${message}` : title;
        // eslint-disable-next-line no-alert
        if (window.confirm(text)) {
            onConfirm();
        } else {
            onCancel?.();
        }
        return;
    }

    Alert.alert(
        title,
        message,
        [
            { text: cancelText, style: 'cancel', onPress: onCancel },
            {
                text: confirmText,
                style: destructive ? 'destructive' : 'default',
                onPress: onConfirm,
            },
        ],
        { cancelable: true, onDismiss: onCancel },
    );
}
