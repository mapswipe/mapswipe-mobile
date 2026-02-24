import {
    useCallback,
    useState,
} from 'react';
import {
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { router } from 'expo-router';
import { isTruthyString } from '@togglecorp/fujs';
import { signInWithEmailAndPassword } from 'firebase/auth';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import InputContainerLayout from '@/components/InputContainerLayout';
import Page from '@/components/Page';
import Text from '@/components/Text';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseAuth } from '@/utils/firebase';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    page: {
        backgroundColor: theme.backgroundBrand,
    },
    heading: {
        color: theme.textOnBrand,
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
            style={styles.page}
        >
            <BlockListView withPadding>
                <View>
                    <Text
                        style={styles.heading}
                        variant="heading"
                    >
                        Welcome to MapSwipe!
                    </Text>
                </View>
                <BlockListView>
                    <InputContainerLayout
                        labelText="Email"
                        input={(
                            <TextInput
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                keyboardType="email-address"
                                placeholder="email"
                                value={email}
                                onChangeText={setEmail}
                                readOnly={pending}
                            />
                        )}
                    />
                    <InputContainerLayout
                        labelText="Password"
                        input={(
                            <TextInput
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="email-address"
                                placeholder="password"
                                value={password}
                                onChangeText={setPassword}
                                readOnly={pending}
                            />
                        )}
                    />
                </BlockListView>
                <Button
                    name={undefined}
                    onPress={handleLoginPress}
                    title="login"
                    disabled={pending}
                    colorVariant="primaryRed"
                    styleVariant="filled"
                />
            </BlockListView>
        </Page>
    );
}

export default Login;
