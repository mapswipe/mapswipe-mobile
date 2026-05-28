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
import {
    createUserWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { update } from 'firebase/database';
import { serverTimestamp } from 'firebase/firestore';

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
import useAsyncHandler from '@/hooks/useAsyncHandler';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    usernameExists,
    validateUserName,
} from '@/utils/common';
import {
    firebaseAuth,
    firebaseRef,
} from '@/utils/firebase';

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
    privacyLink: {
        color: theme.textOnBrand,
        fontSize: FONT_SIZE_XS,
        textDecorationLine: 'underline',
    },
    privacy: {
        alignItems: 'center',
    },
});

function Register() {
    const [username, setUsername] = useState<string>();
    const [email, setEmail] = useState<string>();
    const [password, setPassword] = useState<string>();
    const [agreeToPrivacy, setAgreeToPrivacy] = useState<boolean>(false);
    const [usernameError, setUsernameError] = useState<string>();
    const [passwordError, setPasswordError] = useState<string>();
    const { t } = useTranslation('signup');
    // FIXME: Update the use of this function
    const { handleAsync, loading } = useAsyncHandler();

    const router = useRouter();

    const handleUsernameChange = useCallback((newUsername: string) => {
        setUsername(newUsername);
        const isValid = validateUserName(newUsername);
        setUsernameError(
            !isValid ? t('usernameErrorText') : undefined,
        );
    }, [t]);

    const handlePasswordChange = useCallback((newPassword: string) => {
        setPassword(newPassword);
        setPasswordError(
            newPassword.length < 6 ? t('passwordError') : undefined,
        );
    }, [t]);

    const handleSignUpPress = useCallback(() => {
        handleAsync(
            async () => {
                const isValid = validateUserName(username);
                if (isNotDefined(username)) {
                    return;
                }
                if (!isValid) {
                    showAlert({
                        title: t('errorOnSignup'),
                        message: t('usernameErrorText'),
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
                const userNameAlreadyExist = await usernameExists(username);

                if (userNameAlreadyExist) {
                    showAlert({
                        title: t('errorOnSignup'),
                        message: t('userNameExistError'),
                        alertType: 'error',
                        shouldHideAfterDelay: false,
                    });
                    return;
                }

                const userCredential = await createUserWithEmailAndPassword(
                    firebaseAuth,
                    email ?? '',
                    password ?? '',
                );

                await updateProfile(userCredential.user, {
                    displayName: username,
                });

                const dbPath = `v2/users/${userCredential.user.uid}`;

                await update(firebaseRef(dbPath), {
                    username,
                    usernameKey: username.toLowerCase(),
                    created: serverTimestamp(),
                    groupContributionCount: 0,
                    projectContributionCount: 0,
                    taskContributionCount: 0,
                });
                showAlert({
                    title: t('signup:success'),
                    message: t('signup:welcomeToMapSwipe', { username }),
                    alertType: 'info',
                });
            },
        ).catch((err) => {
            let errorMsg;
            switch (err.code) {
                case 'auth/email-already-in-use':
                    errorMsg = t('signup:emailAlreadyUsed');
                    break;
                case 'auth/invalid-email':
                    errorMsg = t('signup:emailInvalid');
                    break;
                default:
                    errorMsg = t('signup:problemSigningUp');
            }
            showAlert({
                title: t('signup:errorOnSignup'),
                message: errorMsg,
                alertType: 'error',
                shouldHideAfterDelay: false,
            });
        });
    }, [handleAsync, username, email, password, t]);

    const styles = useThemedStyles(createStyles);

    return (
        <Page
            title="Register"
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
                        variant="brand"
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder={t('chooseUsername')}
                        hintText={t('usernamePublic')}
                        value={username}
                        errorText={usernameError}
                        onChangeText={handleUsernameChange}
                        readOnly={loading}
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
                        readOnly={loading}
                    />
                    <TextInput
                        variant="brand"
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder={t('choosePassword')}
                        value={password}
                        onChangeText={handlePasswordChange}
                        errorText={passwordError}
                        readOnly={loading}
                        secureTextEntry
                    />
                    <InlineListView
                        spacing="3xs"
                        style={styles.privacy}
                    >
                        <Checkbox
                            value={agreeToPrivacy}
                            onValueChange={setAgreeToPrivacy}
                            color={agreeToPrivacy ? '#4630EB' : undefined}
                            disabled={loading}
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
                <BlockListView>
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
                        disabled={loading || !agreeToPrivacy}
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
