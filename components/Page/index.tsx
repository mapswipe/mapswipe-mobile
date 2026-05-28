import { useLayoutEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

import { FONT_SIZE_SM } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';

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
        headerTitleAlign = 'left',
        headerRight,
    } = props;
    const navigation = useNavigation();
    const theme = useTheme();
    const styles = useThemedStyles(createStyles, { variant });

    useLayoutEffect(() => {
        navigation.setOptions({
            title,
            headerShown: showBackButton,
            headerBackVisible: showBackButton,
            headerStyle: {
                backgroundColor: theme.backgroundBrand,
            },
            headerTintColor: theme.textOnBrand,
            headerShadowVisible: false,
            headerTitleAlign,
            headerTitleStyle: {
                fontSize: FONT_SIZE_SM,
            },
            headerRight,

        });
    }, [navigation, title, theme, showBackButton, headerTitleAlign, headerRight]);

    const content = scrollable ? <ScrollView>{children}</ScrollView> : children;

    if (showBackButton) {
        // Header is shown — let it handle the top inset
        return (
            <View style={[styles.page, style]}>
                {content}
            </View>
        );
    }

    // No header — apply top safe area ourselves
    return (
        <SafeAreaView style={[styles.page, style]} edges={['top']}>
            {content}
        </SafeAreaView>
    );
}

export default Page;
