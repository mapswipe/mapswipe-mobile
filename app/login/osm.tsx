import {
    useCallback,
    useState,
} from 'react';
import {
    Trans,
    useTranslation,
} from 'react-i18next';
import {
    createURL,
    parse,
} from 'expo-linking';
import { useRouter } from 'expo-router';
import { openAuthSessionAsync } from 'expo-web-browser';
import { signInWithCustomToken } from 'firebase/auth';

import { showAlert } from '@/components/Toast';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import Link from '@/components/ui/Link';
import Row from '@/components/ui/Row';
import Screen from '@/components/ui/Screen';
import AuthScreen from '@/components/ui/Screen/AuthScreen';
import Text from '@/components/ui/Text';
import { firebaseAuth } from '@/utils/firebase';

const APP_NAME = 'MapSwipe';

const PRIVACY_NOTICE_URI = 'https://mapswipe.org/';

function LoginWithOsm() {
    const [agreeToPrivacy, setAgreeToPrivacy] = useState<boolean>(false);
    const [pending, setPending] = useState<boolean>(false);

    const { t } = useTranslation('signup');
    const router = useRouter();

    const handleLoginPress = useCallback(async () => {
        const authUrl = `${process.env.EXPO_PUBLIC_OSM_AUTH_URL}/redirect`;
        const redirectUri = createURL('login/osm');
        try {
            setPending(true);
            const result = await openAuthSessionAsync(authUrl, redirectUri);
            if (result.type === 'success') {
                const { url } = result;
                const parsedUrl = parse(url);
                const { token } = parsedUrl.queryParams as { token?: string };

                if (token) {
                    await signInWithCustomToken(firebaseAuth, token);
                    router.replace('/');
                } else {
                    showAlert({
                        title: 'Login Failed',
                        message: 'No token received from OSM',
                        alertType: 'error',
                    });
                }
            }
            setPending(false);
        } catch (error) {
            setPending(false);
            showAlert({
                title: 'Login Failed',
                message: 'An error occurred during OSM login',
                alertType: 'error',
            });
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }, [router]);

    const handlePrivacyNoticePress = useCallback(
        () => {
            router.push({
                pathname: '/WebviewWindow',
                params: { uri: PRIVACY_NOTICE_URI },
            });
        },
        [router],
    );

    if (pending) {
        return (
            <Screen
                title={t('loginSignupWithOSM')}
                colorVariant="brand"
                pending
                pendingLabel="Signing in..."
            />
        );
    }

    return (
        <AuthScreen
            title={t('loginSignupWithOSM')}
            logoAccessibilityLabel={APP_NAME}
            footer={(
                // `transparent` on `onBrand`, not the `filled` default this inherited before:
                // filled painted backgroundBrand, i.e. the page's own navy, so the box was never
                // visible and only its inset ever showed.
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
            )}
        >
            <Text
                variant="caption"
                colorVariant="onBrand"
            >
                {t('usernamePublic')}
            </Text>
            {/* `wrap` keeps InlineListView's flexWrap: a Text is not shrinkable by default in
                RN, so without it the sentence would overflow the row rather than move below
                the box. */}
            <Row
                spacing="3xs"
                wrap
            >
                <Checkbox
                    checked={agreeToPrivacy}
                    onChange={setAgreeToPrivacy}
                    // The only role whose box AND tick are both theme-stable; see the report.
                    colorVariant="positive"
                    accessibilityLabel={t('IagreeToPrivacyNotice')}
                    disabled={pending}
                />
                <Text
                    variant="caption"
                    colorVariant="onBrand"
                >
                    <Trans
                        i18nKey="signup:IagreeToPrivacyNotice"
                    >
                        I agree to the
                        <Text
                            // Repeated: a nested Text does not inherit the variant, because the
                            // variant sets fontSize outright.
                            variant="caption"
                            colorVariant="onBrand"
                            onPress={handlePrivacyNoticePress}
                            accessibilityLabel={t('IagreeToPrivacyNotice')}
                            withUnderline
                        >
                            Privacy Notice
                        </Text>
                    </Trans>
                </Text>
            </Row>
            <Text
                variant="caption"
                colorVariant="onBrand"
            >
                {t('OSMsignupExplanation')}
            </Text>
            <Button
                onPress={handleLoginPress}
                title={t('loginSignupWithOSM')}
                accessibilityLabel={t('loginSignupWithOSM')}
                colorVariant="negative"
                // The pending branch returns above, so only 'default' and 'disabled' are
                // reachable here.
                state={agreeToPrivacy ? 'default' : 'disabled'}
            />
        </AuthScreen>
    );
}

export default LoginWithOsm;
