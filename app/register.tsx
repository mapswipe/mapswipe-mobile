import {
    useCallback,
    useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { Checkbox } from 'expo-checkbox';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { isTruthyString } from '@togglecorp/fujs';
import { signInWithEmailAndPassword } from 'firebase/auth';

import logo from '@/assets/images/icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import ExternalLink from '@/components/ExternalLink';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import Page from '@/components/Page';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';
import { showAlert } from '@/components/Toast';
import { FONT_SIZE_XS } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseAuth } from '@/utils/firebase';

const disclaimer = '* All the data you contribute to MapSwipe is open and available to anyone. Your username is public, but your email and password will never be shared with anyone.';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    mainContent: {
        flexDirection: 'column',
        gap: 48,
    },
    icon: {
        width: 128,
        height: 128,
    },
    page: {
        paddingTop: 96,
    },
    text: {
        color: theme.textOnBrand,
        fontSize: FONT_SIZE_XS,
    },
    privacyLink: {
        color: theme.textOnBrand,
        fontSize: FONT_SIZE_XS,
        textDecorationLine: 'underline',
    },
});

function Register() {
    const [username, setUsername] = useState<string>();
    const [email, setEmail] = useState<string>();
    const [password, setPassword] = useState<string>();
    const [agreeToPrivacy, setAgreeToPrivacy] = useState<boolean>(false);
    const [pending, setPending] = useState<boolean>(false);

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
            style={styles.page}
        >
            <BlockListView
                spacing="sm"
            >
                <BlockListView withCenteredContent>
                    <Image
                        style={styles.icon}
                        source={logo}
                    />
                </BlockListView>
                <BlockListView
                    withPadding
                >
                    <TextInput
                        variant="brand"
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Choose your username"
                        hintText="Your username will be publicly visible"
                        value={username}
                        onChangeText={setUsername}
                        readOnly={pending}
                    />
                    <TextInput
                        variant="brand"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        keyboardType="email-address"
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        readOnly={pending}
                    />
                    <TextInput
                        variant="brand"
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Choose your password"
                        value={password}
                        onChangeText={setPassword}
                        readOnly={pending}
                        secureTextEntry
                    />
                    <InlineListView
                        spacing="3xs"
                    >
                        <Checkbox
                            value={agreeToPrivacy}
                            onValueChange={setAgreeToPrivacy}
                            color={agreeToPrivacy ? '#4630EB' : undefined}
                            disabled={pending}
                        />
                        <Text
                            variant="label"
                            style={styles.text}
                        >
                            I agree to the
                        </Text>
                        <ExternalLink
                            href="https://mapswipe.org/privacy"
                            style={styles.privacyLink}
                        >
                            Privacy Notice
                        </ExternalLink>
                    </InlineListView>
                </BlockListView>
                <BlockListView
                    withPadding
                >
                    <Text
                        variant="label"
                        style={styles.text}
                    >
                        {disclaimer}
                    </Text>
                    <Button
                        name={undefined}
                        onPress={handleLoginPress}
                        title="Sign up"
                        disabled={pending}
                        colorVariant="primaryRed"
                        styleVariant="filled"
                    />
                    <BlockListView>
                        <Link
                            spacing="xs"
                            href={{
                                pathname: '/login',
                            }}
                            title="Log in to an existing account"
                        />
                        <Link
                            spacing="xs"
                            href={{
                                // FIXME: Add proper redirect
                                pathname: '/project',
                            }}
                            title="Login with OpenStreetMap"
                        />
                    </BlockListView>
                </BlockListView>
            </BlockListView>
        </Page>
    );
}

export default Register;
