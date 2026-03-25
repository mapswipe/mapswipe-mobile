import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { sendPasswordResetEmail } from 'firebase/auth';

import logo from '@/assets/images/icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Link from '@/components/Link';
import Page from '@/components/Page';
import TextInput from '@/components/TextInput';
import { showAlert } from '@/components/Toast';
import useAsyncHandler from '@/hooks/useAsyncHandler';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseAuth } from '@/utils/firebase';

const createStyles = () => StyleSheet.create({
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

function ForgoPassword() {
    const [email, setEmail] = useState<string>();
    const { handleAsync, isLoading } = useAsyncHandler();
    const { t } = useTranslation('signup');

    const handleResetPress = useCallback(async () => {
        handleAsync(async () => {
            if (!email) return;
            await sendPasswordResetEmail(firebaseAuth, email);
        }).then(() => {
            showAlert({
                title: t('signup:success'),
                message: t('signup:checkYourEmail'),
                alertType: 'info',
            });
        }).catch((error) => {
            let errorMessage;
            switch (error.code) {
                case 'auth/user-not-found':
                    errorMessage = t('signup:noAccountFoundForEmail');
                    break;
                case 'auth/invalid-email':
                    errorMessage = t('signup:emailInvalid');
                    break;
                default:
                    errorMessage = t('signup:problemResettingPassword');
            }
            showAlert({
                title: t('signup:errorResetPass'),
                message: errorMessage,
                alertType: 'error',
                shouldHideAfterDelay: false,
            });
        });
    }, [handleAsync, email, t]);

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
                        readOnly={isLoading}
                    />
                </BlockListView>
                <BlockListView
                    withPadding
                >
                    <Button
                        name={undefined}
                        onPress={handleResetPress}
                        title={t('sendResetEmail')}
                        disabled={isLoading}
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

export default ForgoPassword;
