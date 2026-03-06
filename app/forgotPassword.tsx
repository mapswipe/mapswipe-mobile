import {
    useCallback,
    useState,
} from 'react';
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
});

function Login() {
    const [email, setEmail] = useState<string>();
    const [pending, setPending] = useState<boolean>(false);

    const handleResetPress = useCallback(async () => {
        // TODO: Handle forgot password logic
    }, [email]);

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
                        placeholder="Enter your email"
                        hintText="* We will send you and email to reset your password"
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
                        title="Send reset email"
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
                            title="Back to login"
                        />
                    </BlockListView>
                </BlockListView>
            </BlockListView>
        </Page>
    );
}

export default Login;
