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
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { signInWithCustomToken } from 'firebase/auth';

import logo from '@/assets/images/icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import LoadingComponent from '@/components/Loader';
import Page from '@/components/Page';
import Text from '@/components/Text';
import { showAlert } from '@/components/Toast';
import { FONT_SIZE_XS } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseAuth } from '@/utils/firebase';

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
    privacy: {
        alignItems: 'center',
    },
    privacyLink: {
        color: theme.textOnBrand,
        fontSize: FONT_SIZE_XS,
        textDecorationLine: 'underline',
    },
});

function LoginWithOsm() {
    const [agreeToPrivacy, setAgreeToPrivacy] = useState<boolean>(false);
    const [pending, setPending] = useState<boolean>(false);

    const { t } = useTranslation('signup');
    const router = useRouter();

    const handleLoginPress = useCallback(async () => {
        const authUrl = `${process.env.EXPO_PUBLIC_OSM_AUTH_URL}/redirect`;
        const redirectUri = Linking.createURL('login/osm');
        try {
            setPending(true);
            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
            if (result.type === 'success') {
                const { url } = result;
                const parsedUrl = Linking.parse(url);
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

    const styles = useThemedStyles(createStyles);

    if (pending) {
        return (<LoadingComponent label="Signing in..." />);
    }

    return (
        <Page
            title={t('loginSignupWithOSM')}
            variant="brand"
            style={styles.page}
        >
            <BlockListView
                spacing="sm"
                withPadding
            >
                <BlockListView withCenteredContent>
                    <Image
                        style={styles.icon}
                        source={logo}
                    />
                </BlockListView>
                <BlockListView spacing="sm">
                    <Text
                        variant="label"
                        style={styles.text}
                    >
                        {t('usernamePublic')}
                    </Text>
                    <InlineListView
                        spacing="3xs"
                        style={styles.privacy}
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
                    <Text
                        variant="label"
                        style={styles.text}
                    >
                        {t('OSMsignupExplanation')}
                    </Text>
                    <Button
                        name={undefined}
                        onPress={handleLoginPress}
                        title={t('loginSignupWithOSM')}
                        colorVariant="primaryRed"
                        styleVariant="filled"
                        disabled={!agreeToPrivacy || pending}
                    />
                    <BlockListView>
                        <Link
                            spacing="xs"
                            href={{
                                pathname: '/login',
                            }}
                            title={t('loginExistingAccount')}
                        />
                    </BlockListView>
                </BlockListView>
            </BlockListView>
        </Page>
    );
}

export default LoginWithOsm;
