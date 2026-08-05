import {
    useCallback,
    useState,
} from 'react';
import {
    Trans,
    useTranslation,
} from 'react-i18next';
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

import { showAlert } from '@/components/Toast';
import Button from '@/components/ui/Button';
import { type ButtonStateType } from '@/components/ui/ButtonLayout';
import Checkbox from '@/components/ui/Checkbox';
import Link from '@/components/ui/Link';
import Row from '@/components/ui/Row';
import AuthScreen from '@/components/ui/Screen/AuthScreen';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import TextInput from '@/components/ui/TextInput';
import useAsyncHandler from '@/hooks/useAsyncHandler';
import {
    MAX_USERNAME_LENGTH,
    usernameExists,
    validateUserName,
} from '@/utils/common';
import {
    firebaseAuth,
    firebaseRef,
} from '@/utils/firebase';

const APP_NAME = 'MapSwipe';

const PRIVACY_AGREEMENT_LABEL = 'I agree to the Privacy Notice';
const PRIVACY_NOTICE_LABEL = 'Privacy Notice';

const PRIVACY_NOTICE_URI = 'https://mapswipe.org/';

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

    const handlePrivacyNoticePress = useCallback(() => {
        router.push({
            pathname: '/WebviewWindow',
            params: { uri: PRIVACY_NOTICE_URI },
        });
    }, [router]);

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
                    created: new Date().toISOString(),
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

    const fieldStateVariant = loading ? 'disabled' : 'editable';

    let signUpState: ButtonStateType = 'default';
    if (loading) {
        signUpState = 'pending';
    } else if (!agreeToPrivacy) {
        signUpState = 'disabled';
    }

    return (
        <AuthScreen
            title="Register"
            logoAccessibilityLabel={APP_NAME}
            footer={(
                <>
                    <Link
                        href={{
                            pathname: '/login',
                        }}
                        title={t('loginExistingAccount')}
                        accessibilityLabel={t('loginExistingAccount')}
                        colorVariant="onBrand"
                        styleVariant="transparent"
                        padding="2xs"
                    />
                    <Link
                        href={{
                            pathname: '/login/osm',
                        }}
                        title={t('loginSignupWithOSM')}
                        accessibilityLabel={t('loginSignupWithOSM')}
                        colorVariant="onBrand"
                        styleVariant="transparent"
                        padding="2xs"
                    />
                </>
            )}
        >
            <Stack spacing="md">
                <TextInput
                    contentVariant="username"
                    accessibilityLabel={t('chooseUsername')}
                    placeholder={t('chooseUsername')}
                    hintText={t('usernamePublic')}
                    value={username}
                    errorText={usernameError}
                    onChangeText={handleUsernameChange}
                    maxLength={MAX_USERNAME_LENGTH}
                    stateVariant={fieldStateVariant}
                />
                <TextInput
                    contentVariant="email"
                    accessibilityLabel={t('enterYourEmail')}
                    placeholder={t('enterYourEmail')}
                    value={email}
                    onChangeText={setEmail}
                    stateVariant={fieldStateVariant}
                />
                <TextInput
                    contentVariant="password"
                    accessibilityLabel={t('choosePassword')}
                    placeholder={t('choosePassword')}
                    value={password}
                    onChangeText={handlePasswordChange}
                    errorText={passwordError}
                    stateVariant={fieldStateVariant}
                />
                {/* RN Text does not shrink, so without wrap the sentence overflows the row. */}
                <Row
                    spacing="3xs"
                    wrap
                >
                    <Checkbox
                        checked={agreeToPrivacy}
                        onChange={setAgreeToPrivacy}
                        colorVariant="positive"
                        accessibilityLabel={PRIVACY_AGREEMENT_LABEL}
                        disabled={loading}
                    />
                    <Text
                        variant="caption"
                        colorVariant="onBrand"
                    >
                        <Trans i18nKey="signup:IagreeToPrivacyNotice">
                            I agree to the
                            <Text
                                // A nested Text does not inherit the variant, so repeat it.
                                variant="caption"
                                colorVariant="onBrand"
                                onPress={handlePrivacyNoticePress}
                                accessibilityLabel={PRIVACY_NOTICE_LABEL}
                                withUnderline
                            >
                                Privacy Notice
                            </Text>
                        </Trans>
                    </Text>
                </Row>
            </Stack>
            <Stack spacing="md">
                <Text
                    variant="caption"
                    colorVariant="onBrand"
                >
                    {t('contributionWarningOnSignup')}
                </Text>
                <Button
                    onPress={handleSignUpPress}
                    title={t('signUp')}
                    accessibilityLabel={t('signUp')}
                    colorVariant="negative"
                    state={signUpState}
                />
            </Stack>
        </AuthScreen>
    );
}

export default Register;
