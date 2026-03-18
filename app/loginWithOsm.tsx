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

import logo from '@/assets/images/icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import Page from '@/components/Page';
import Text from '@/components/Text';
import { FONT_SIZE_XS } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

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
    const [agreeToPrivacy, setAgreeToPrivacy] = useState<boolean>(false);

    const { t } = useTranslation('signup');
    const router = useRouter();

    const handleLoginPress = useCallback(async () => {
        // FIXME: Handle this properly
    }, []);

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
                    <Text
                        variant="label"
                        style={styles.text}
                    >
                        {t('usernamePublic')}
                    </Text>
                    <InlineListView
                        spacing="3xs"
                    >
                        <Checkbox
                            value={agreeToPrivacy}
                            onValueChange={setAgreeToPrivacy}
                            color={agreeToPrivacy ? '#4630EB' : undefined}
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
                        disabled={!agreeToPrivacy}
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

export default Register;
