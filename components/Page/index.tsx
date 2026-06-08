import {
    useCallback,
    useLayoutEffect,
} from 'react';
import {
    ScrollView,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { FONT_SIZE_MD } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';

import BackButton from '../BackButton';

type Variant = 'normal' | 'brand';

const createStyles = (theme: AppTheme, { variant }: { variant: Variant }) => StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: variant === 'brand' ? theme.backgroundBrand : theme.background,
    },
});

interface Props {
    title: string;
    style?: ViewStyle,
    children: React.ReactNode;
    variant?: 'normal' | 'brand';
    scrollable?: boolean
    showBackButton?: boolean;
    onClickBackButton?: () => void;
    headerTitleAlign?: 'left' | 'center';
    headerRight?: () => React.ReactNode;
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

    const backButton = useCallback(() => (
        <BackButton
            onPress={onClickBackButton}
        />
    ), [onClickBackButton]);

    useLayoutEffect(
        () => {
            navigation.setOptions({
                title,
                headerShown: showBackButton,
                headerBackVisible: false,
                headerStyle: {
                    backgroundColor: theme.backgroundBrand,
                },
                headerTintColor: theme.textOnBrand,
                headerShadowVisible: false,
                headerTitleAlign,
                headerTitleStyle: {
                    fontSize: FONT_SIZE_MD,
                },
                headerRight,
                headerLeft: backButton
                ,
            });
        },
        [
            navigation,
            title,
            theme,
            showBackButton,
            headerTitleAlign,
            headerRight,
            onClickBackButton,
            backButton,
        ],
    );

    // Header is always brand-colored, so status bar needs light content whenever
    // the brand background is visible (either as the page bg or as the header).
    const statusBarStyle = variant === 'brand' || showBackButton ? 'light' : 'dark';

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
