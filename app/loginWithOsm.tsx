import {
    useCallback,
    useState,
} from 'react';
import { StyleSheet } from 'react-native';
import { Checkbox } from 'expo-checkbox';
import { Image } from 'expo-image';

import logo from '@/assets/images/icon.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import ExternalLink from '@/components/ExternalLink';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import Page from '@/components/Page';
import Text from '@/components/Text';
import { FONT_SIZE_XS } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

const disclaimer = 'Your username will be publicly visible.';
const info = 'You can sign up to MapSwipe using your OpenStreetMap account. If you already have a MapSwipe account, this will not link them together! (this will come soon in a future release)';

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
                        {disclaimer}
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
                            I agree to the
                        </Text>
                        <ExternalLink
                            href="https://mapswipe.org/privacy"
                            style={styles.privacyLink}
                        >
                            Privacy Notice
                        </ExternalLink>
                    </InlineListView>
                    <Text
                        variant="label"
                        style={styles.text}
                    >
                        {info}
                    </Text>
                    <Button
                        name={undefined}
                        onPress={handleLoginPress}
                        title="Login with OpenStreetMap"
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
                            title="Log in to an existing account"
                        />
                    </BlockListView>
                </BlockListView>
            </BlockListView>
        </Page>
    );
}

export default Register;
