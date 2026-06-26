import {
    useCallback,
    useLayoutEffect,
    useRef,
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
    onClickBackButton?: (proceedWithBack: () => void) => void;
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
        onClickBackButton,
        headerTitleAlign = 'left',
        headerRight,
    } = props;
    const navigation = useNavigation();
    const theme = useTheme();
    const styles = useThemedStyles(createStyles, { variant });

    // When the caller confirms navigation (calls proceedWithBack), we set this
    // to true so the re-dispatched GO_BACK action isn't intercepted again.
    const bypassNextRef = useRef(false);

    const backButton = useCallback(() => (
        <BackButton
            // Route the tap through navigation.goBack() instead of calling
            // onClickBackButton directly, so taps and swipe-gestures both
            // funnel through the same beforeRemove listener below.
            onPress={() => navigation.goBack()}
        />
    ), [navigation]);

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
        },
        [
            navigation,
            theme,
            showBackButton,
            headerTitleAlign,
            headerTitle,
            headerRight,
            onClickBackButton,
            backButton,
        ],
    );

    // Intercepts EVERY dismissal path for this screen: swipe-back gesture,
    // Android IOS hardware back button, and the tap-triggered goBack() above.
    // This is the fix — onPress alone never fires for gesture/hardware back
    // since those dispatch GO_BACK natively, bypassing the JS prop entirely.
    useLayoutEffect(
        () => {
            if (!onClickBackButton) {
                return undefined;
            }
            const unsubscribe = navigation.addListener('beforeRemove', (e) => {
                // Only intercept genuine back gestures/button presses.
                // Programmatic replace/reset (e.g. router.replace('/')) must
                // not be blocked — those are intentional route changes.
                if (e.data.action.type !== 'GO_BACK') {
                    return;
                }
                if (bypassNextRef.current) {
                    bypassNextRef.current = false;
                    return;
                }
                e.preventDefault();
                onClickBackButton(() => {
                    bypassNextRef.current = true;
                    navigation.dispatch(e.data.action);
                });
            });

            return unsubscribe;
        },
        [navigation, onClickBackButton],
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
