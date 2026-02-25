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
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';
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
});

function Login() {
    const [email, setEmail] = useState<string>();
    const [password, setPassword] = useState<string>();
    const [pending, setPending] = useState<boolean>(false);

    const handleLoginPress = useCallback(async () => {
        if (isTruthyString(email) && isTruthyString(password)) {
            try {
                setPending(true);
                await signInWithEmailAndPassword(firebaseAuth, email, password);
                setPending(false);
                router.replace('/');
            } catch (ex) {
                setPending(false);
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
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        keyboardType="email-address"
                        placeholder="Enter your email"
                        placeholderTextColor="#fff"
                        value={email}
                        onChangeText={setEmail}
                        readOnly={pending}
                    />
                    <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Enter your password"
                        placeholderTextColor="#fff"
                        value={password}
                        onChangeText={setPassword}
                        readOnly={pending}
                        secureTextEntry
                    />
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
                        title="login"
                        disabled={pending}
                        colorVariant="primaryRed"
                        styleVariant="filled"
                    />
                    <BlockListView>
                        <Link
                            spacing="xs"
                            href={{
                                // FIXME: Create forgot password page
                                pathname: '/project',
                            }}
                            title="Forgot your password?"
                        />
                        <Link
                            spacing="xs"
                            href={{
                                // FIXME: Create forgot password page
                                pathname: '/project',
                            }}
                            title="Create New Account"
                        />
                    </BlockListView>
                </BlockListView>
            </BlockListView>
        </Page>
    );
}

export default Login;
