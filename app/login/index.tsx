import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { isTruthyString } from '@togglecorp/fujs';
import { signInWithEmailAndPassword } from 'firebase/auth';

import logo from '@/assets/images/icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Link from '@/components/Link';
import Page from '@/components/Page';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';
import { showAlert } from '@/components/Toast';
import { FONT_SIZE_XS } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseAuth } from '@/utils/firebase';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    icon: {
        width: 128,
        height: 128,
    },
    logoContainer: {
        paddingTop: 96,
    },
    text: {
        color: theme.textOnBrand,
        fontSize: FONT_SIZE_XS,
    },
});

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

    const styles = useThemedStyles(createStyles);

    return (
        <Page
            title="Login"
            variant="brand"
        >
            <BlockListView
                spacing="sm"
                withPadding
            >
                <BlockListView
                    withCenteredContent
                    style={styles.logoContainer}
                >
                    <Image
                        style={styles.icon}
                        source={logo}
                    />
                </BlockListView>
                <BlockListView>
                    <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        keyboardType="email-address"
                        placeholder={t('enterYourEmail')}
                        value={email}
                        onChangeText={setEmail}
                        readOnly={pending}
                    />
                    <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder={t('enterYourPassword')}
                        value={password}
                        onChangeText={setPassword}
                        readOnly={pending}
                        secureTextEntry
                    />
                </BlockListView>
                <BlockListView>
                    <Text
                        variant="label"
                        style={styles.text}
                    >
                        {t('contributionWarningOnSignup')}
                    </Text>
                    <Button
                        name={undefined}
                        onPress={handleLoginPress}
                        title={t('login')}
                        disabled={pending}
                        colorVariant="primaryRed"
                        styleVariant="filled"
                    />
                    <BlockListView>
                        <Link
                            spacing="xs"
                            href={{
                                pathname: '/forgotPassword',
                            }}
                            title={t('forgotPassword')}
                        />
                        <Link
                            spacing="xs"
                            href={{
                                pathname: '/register',
                            }}
                            title={t('createNewAccount')}
                        />
                    </BlockListView>
                </BlockListView>
            </BlockListView>
        </Page>
    );
}

export default Login;
