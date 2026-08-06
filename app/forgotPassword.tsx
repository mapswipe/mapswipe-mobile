import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';

import { showAlert } from '@/components/Toast';
import Button from '@/components/ui/Button';
import AuthScreen from '@/components/ui/Screen/AuthScreen';
import TextInput from '@/components/ui/TextInput';
import useAsyncHandler from '@/hooks/useAsyncHandler';
import { firebaseAuth } from '@/utils/firebase';

// Untranslated: no locale bundle carries an `appName` key.
const APP_NAME = 'MapSwipe';

function ForgoPassword() {
    const [email, setEmail] = useState<string>();
    // FIXME: Update the use of this function
    const { handleAsync, loading } = useAsyncHandler();
    const { t } = useTranslation('signup');
    const router = useRouter();

    const handleResetPress = useCallback(async () => {
        handleAsync(async () => {
            if (!email) return;
            await sendPasswordResetEmail(firebaseAuth, email);
        }).then(() => {
            showAlert({
                title: t('signup:success'),
                message: t('signup:checkYourEmail'),
                alertType: 'info',
            });
        }).catch((error) => {
            let errorMessage;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = t('signup:noAccountFoundForEmail');
                    break;
                case 'auth/invalid-email':
                    errorMessage = t('signup:emailInvalid');
                    break;
                default:
                    errorMessage = t('signup:problemResettingPassword');
            }
            showAlert({
                title: t('signup:errorResetPass'),
                message: errorMessage,
                alertType: 'error',
                shouldHideAfterDelay: false,
            });
        });
    }, [handleAsync, email, t]);

    return (
        <AuthScreen
            // Wrong name, but the header is hidden here so it is never drawn.
            title="Login"
            logoAccessibilityLabel={APP_NAME}
            footer={(
                <Button
                    onPress={router.back}
                    title={t('backToLogin')}
                    accessibilityLabel={t('backToLogin')}
                    colorVariant="onBrand"
                    styleVariant="transparent"
                />
            )}
        >
            <TextInput
                contentVariant="email"
                accessibilityLabel={t('enterYourEmail')}
                placeholder={t('enterYourEmail')}
                hintText={t('sendResetEmailWarning')}
                value={email}
                onChangeText={setEmail}
                stateVariant={loading ? 'disabled' : 'editable'}
            />
            <Button
                onPress={handleResetPress}
                title={t('sendResetEmail')}
                accessibilityLabel={t('sendResetEmail')}
                colorVariant="negative"
                state={loading ? 'pending' : 'default'}
            />
        </AuthScreen>
    );
}

export default ForgoPassword;
