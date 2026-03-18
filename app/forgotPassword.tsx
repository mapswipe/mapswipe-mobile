import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

import logo from '@/assets/images/icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Link from '@/components/Link';
import Page from '@/components/Page';
import TextInput from '@/components/TextInput';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

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
});

function Login() {
    const [email, setEmail] = useState<string>();
    const [pending, setPending] = useState<boolean>(false);

    const handleResetPress = useCallback(async () => {
        // TODO: Handle forgot password logic
    }, [email]);

    const { t } = useTranslation('signup');

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
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        keyboardType="email-address"
                        placeholder={t('enterYourEmail')}
                        hintText={t('sendResetEmailWarning')}
                        value={email}
                        onChangeText={setEmail}
                        readOnly={pending}
                    />
                </BlockListView>
                <BlockListView
                    withPadding
                >
                    <Button
                        name={undefined}
                        onPress={handleResetPress}
                        title={t('sendResetEmail')}
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
                            title={t('backToLogin')}
                        />
                    </BlockListView>
                </BlockListView>
            </BlockListView>
        </Page>
    );
}

export default Login;
