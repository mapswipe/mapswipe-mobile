import {
    useCallback,
    useLayoutEffect,
    useState,
} from 'react';
import {
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    useFocusEffect,
    useNavigation,
} from 'expo-router';
import {
    setStatusBarStyle,
    StatusBar,
} from 'expo-status-bar';

import { FONT_SIZE_MD } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';

import BackButton from '../BackButton';
import Modal from '../Modal';
import Text from '../Text';

type Variant = 'normal' | 'brand';

const createStyles = (theme: AppTheme, { variant }: { variant: Variant }) => StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: variant === 'brand' ? theme.backgroundBrand : theme.background,
    },
    headerTitle: {
        fontSize: FONT_SIZE_MD,
        color: theme.textOnBrand,
    },
});

interface Props {
    title: string;
    style?: ViewStyle,
    children: React.ReactNode;
    variant?: 'normal' | 'brand';
    scrollable?: boolean
    showBackButton?: boolean;
    // Overrides the header back button's default goBack(). Use to intercept the
    // tap (e.g. to confirm before leaving). Must be stable (memoized).
    onBackPress?: () => void;
    headerTitleAlign?: 'left' | 'center';
    headerRight?: () => React.ReactNode;
}

function TitleWithPopup({ title, styles }:
     { title: string; styles: ReturnType<typeof createStyles> }) {
    const [visible, setVisible] = useState(false);
    return (
        <>
            <TouchableOpacity
                onLongPress={() => setVisible(true)}
                activeOpacity={1}
            >
                <Text
                    style={styles.headerTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {title}
                </Text>
            </TouchableOpacity>
            <Modal
                open="title-popup"
                visible={visible}
                onClose={() => setVisible(false)}
                animationType="slide"
            >
                <Text variant="title">{title}</Text>
            </Modal>
        </>
    );
}

function Page(props: Props) {
    const {
        title,
        children,
        style,
        variant = 'normal',
        scrollable = true,
        showBackButton = false,
        onBackPress,
        headerTitleAlign = 'left',
        headerRight,
    } = props;
    const navigation = useNavigation();
    const theme = useTheme();
    const styles = useThemedStyles(createStyles, { variant });

    const backButton = useCallback(() => (
        <BackButton
            onPress={onBackPress ?? (() => navigation.goBack())}
        />
    ), [navigation, onBackPress]);

    const headerTitle = useCallback(
        () => (
            <TitleWithPopup
                title={title}
                styles={styles}
            />
        ),
        [title, styles],
    );

    useLayoutEffect(
        () => {
            // Page is occasionally rendered outside a navigator (e.g. the root
            // layout's loading screen while auth resolves). There, useNavigation
            // returns a placeholder whose setOptions throws ("Options cannot be
            // set from a placeholder screen."). Nothing to configure in that
            // case, so swallow the error.
            try {
                navigation.setOptions({
                    headerShown: showBackButton,
                    headerBackVisible: false,
                    headerStyle: {
                        backgroundColor: theme.backgroundBrand,
                    },
                    headerTintColor: theme.textOnBrand,
                    headerShadowVisible: false,
                    headerTitleAlign,
                    headerTitle,
                    headerRight,
                    headerLeft: backButton,
                });
            } catch {
                // not inside a navigator screen — no header to configure
            }
        },
        [
            navigation,
            theme,
            showBackButton,
            headerTitleAlign,
            headerTitle,
            headerRight,
            backButton,
        ],
    );

    const statusBarStyle = variant === 'brand' || showBackButton ? 'light' : 'dark';

    useFocusEffect(
        useCallback(() => {
            setStatusBarStyle(statusBarStyle);
        }, [statusBarStyle]),
    );

    const content = scrollable ? <ScrollView>{children}</ScrollView> : children;

    if (showBackButton) {
        return (
            <SafeAreaView style={[styles.page, style]} edges={['bottom']}>
                <StatusBar style={statusBarStyle} />
                {content}
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.page, style]} edges={['top']}>
            <StatusBar style={statusBarStyle} />
            {content}
        </SafeAreaView>
    );
}

export default Page;
