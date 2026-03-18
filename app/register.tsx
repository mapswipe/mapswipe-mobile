import {
    useCallback,
    useState,
} from 'react';
import {
    Trans,
    useTranslation,
} from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Checkbox } from 'expo-checkbox';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import logo from '@/assets/images/icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import Page from '@/components/Page';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';
import { showAlert } from '@/components/Toast';
import { FONT_SIZE_XS } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    usernameExists,
    validateUserName,
} from '@/utils/common';

const disclaimer = '* All the data you contribute to MapSwipe is open and available to anyone. Your username is public, but your email and password will never be shared with anyone.';
const usernameErrorText = 'Username must be at least 4 characters long and cannot contain space and uppercase';

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
    const [usernameError, setUsernameError] = useState<string>();
    const [passwordError, setPasswordError] = useState<string>();
    const [pending, setPending] = useState<boolean>(false);
    const { t } = useTranslation('signup');
    const router = useRouter();

    const handleUsernameChange = useCallback((newUsername: string) => {
        setUsername(newUsername);
        const isValid = validateUserName(newUsername);
        setUsernameError(
            !isValid ? usernameErrorText : undefined,
        );
    }, []);

    const handlePasswordChange = useCallback((newPassword: string) => {
        setPassword(newPassword);
        setPasswordError(
            newPassword.length < 6 ? t('passwordError') : undefined,
        );
    }, [t]);

    const handleSignUpPress = useCallback(async () => {
        const isValid = validateUserName(username);
        if (isNotDefined(username)) {
            return;
        }
        if (!isValid) {
            showAlert({
                title: t('errorOnSignup'),
                message: usernameErrorText,
                alertType: 'error',
            });
            return;
        }
        if (isDefined(username) && username?.indexOf('@') !== -1) {
            showAlert({
                title: t('errorOnSignup'),
                message: t('usernameNotEmail'),
                alertType: 'error',
                shouldHideAfterDelay: false,
            });
            return;
        }
        setPending(true);
        try {
            const userNameAlreadyExist = await usernameExists(username);

            if (userNameAlreadyExist) {
                showAlert({
                    title: t('errorOnSignup'),
                    message: t('userNameExistError'),
                    alertType: 'error',
                    shouldHideAfterDelay: false,
                });
                setPending(false);
            }
        } catch (_: unknown) {
            setPending(false);
            return;
        }
        console.log('handle register here');
    }, [
        username, t,
    ]);

    const styles = useThemedStyles(createStyles);

    return (
        <Page
            title="Register"
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
                        placeholder={t('chooseUsername')}
                        hintText={t('usernamePublic')}
                        value={username}
                        errorText={usernameError}
                        onChangeText={handleUsernameChange}
                        readOnly={pending}
                    />
                    <TextInput
                        variant="brand"
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
                        variant="brand"
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder={t('choosePassword')}
                        value={password}
                        onChangeText={handlePasswordChange}
                        errorText={passwordError}
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
                            <Trans
                                i18nKey="signup:IagreeToPrivacyNotice"

                            >
                                I agree to the
                                <Text
                                    style={styles.privacyLink}
                                    onPress={() => router.push({
                                        pathname: '/WebviewWindow',
                                        params: { uri: 'https://mapswipe.org/' },
                                    })}
                                >
                                    Privacy Notice
                                </Text>
                            </Trans>
                        </Text>
                    </InlineListView>
                </BlockListView>
                <BlockListView
                    withPadding
                >
                    <Text
                        variant="label"
                        style={styles.text}
                    >
                        {t('contributionWarningOnSignup')}
                    </Text>
                    <Button
                        name={undefined}
                        onPress={handleSignUpPress}
                        title={t('signUp')}
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
                            title={t('loginExistingAccount')}
                        />
                        <Link
                            spacing="xs"
                            href={{
                                pathname: '/loginWithOsm',
                            }}
                            title={t('loginSignupWithOSM')}
                        />
                    </BlockListView>
                </BlockListView>
            </BlockListView>
        </Page>
    );
}

export default Register;
