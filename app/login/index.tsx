import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { isTruthyString } from '@togglecorp/fujs';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { showAlert } from '@/components/Toast';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import AuthScreen from '@/components/ui/Screen/AuthScreen';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import TextInput from '@/components/ui/TextInput';
import { firebaseAuth } from '@/utils/firebase';

const APP_NAME = 'MapSwipe';

function Login() {
    const [email, setEmail] = useState<string>();
    const [password, setPassword] = useState<string>();
    const [pending, setPending] = useState<boolean>(false);

    const { t } = useTranslation('signup');

    const handleLoginPress = useCallback(async () => {
        if (isTruthyString(email) && isTruthyString(password)) {
            try {
                setPending(true);
                await signInWithEmailAndPassword(firebaseAuth, email, password);
                setPending(false);
                router.replace('/');
            } catch (ex) {
                const error = ex as { code: string };
                let errorMessage = '';
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'No account found for this email';
                        break;
                    case 'auth/wrong-password':
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email or password';
                        break;
                    default:
                        errorMessage = 'Problem logging in';
                }

                setPending(false);
                showAlert({
                    title: 'Failed to Login',
                    message: errorMessage,
                    alertType: 'error',
                });
                // eslint-disable-next-line no-console
                console.info(ex);
            }
        }
    }, [email, password]);

    return (
        <AuthScreen
            title="Login"
            logoAccessibilityLabel={APP_NAME}
            footer={(
                <>
                    {/* `transparent` on `onBrand`, not the `filled` default these inherited
                        before: filled painted backgroundBrand, i.e. the page's own navy, so the
                        box was never visible and only its inset ever showed. */}
                    <Link
                        href={{
                            pathname: '/forgotPassword',
                        }}
                        title={t('forgotPassword')}
                        accessibilityLabel={t('forgotPassword')}
                        colorVariant="onBrand"
                        styleVariant="transparent"
                        padding="2xs"
                    />
                    <Link
                        href={{
                            pathname: '/register',
                        }}
                        title={t('createNewAccount')}
                        accessibilityLabel={t('createNewAccount')}
                        colorVariant="onBrand"
                        styleVariant="transparent"
                        padding="2xs"
                    />
                </>
            )}
        >
            {/* The fields sit 24 apart where the page rhythm is 20, which is what Field's
                internal 8 is cut against. */}
            <Stack spacing="md">
                <TextInput
                    contentVariant="email"
                    placeholder={t('enterYourEmail')}
                    // The placeholder is gone by the second keystroke, so the name repeats it.
                    accessibilityLabel={t('enterYourEmail')}
                    value={email}
                    onChangeText={setEmail}
                    stateVariant={pending ? 'disabled' : 'editable'}
                />
                <TextInput
                    contentVariant="password"
                    placeholder={t('enterYourPassword')}
                    accessibilityLabel={t('enterYourPassword')}
                    value={password}
                    onChangeText={setPassword}
                    stateVariant={pending ? 'disabled' : 'editable'}
                />
            </Stack>
            <Stack spacing="md">
                <Text
                    variant="caption"
                    colorVariant="onBrand"
                >
                    {t('contributionWarningOnSignup')}
                </Text>
                <Button
                    onPress={handleLoginPress}
                    title={t('login')}
                    accessibilityLabel={t('login')}
                    colorVariant="negative"
                    state={pending ? 'pending' : 'default'}
                />
            </Stack>
        </AuthScreen>
    );
}

export default Login;
