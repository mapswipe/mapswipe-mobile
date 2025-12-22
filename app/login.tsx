import BlockListView from "@/components/BlockListView";
import InputContainerLayout from "@/components/InputContainerLayout";
import Page from "@/components/Page";
import { firebaseAuth } from "@/utils/firebase";
import { isTruthyString } from "@togglecorp/fujs";
import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useCallback, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";

function Login() {
    const [email, setEmail] = useState<string>();
    const [password, setPassword] = useState<string>();
    const [pending, setPending] = useState<boolean>(false);

    const handleLoginPress = useCallback(async () => {
        if (isTruthyString(email) && isTruthyString(password)) {
            setPending(true);
            await signInWithEmailAndPassword(firebaseAuth, email, password);
            setPending(false);
            router.replace('/');
        }
    }, [email, password]);

    return (
        <Page title="Login">
            <BlockListView withPadding>
                <View>
                    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
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
                            />
                        )}
                    />
                </BlockListView>
                <Button
                    onPress={handleLoginPress}
                    title="login"
                    disabled={pending}
                />
            </BlockListView>
        </Page>
    );
}

export default Login;
