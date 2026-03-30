import { useLayoutEffect } from 'react';
import {
    ScrollView,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

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
    isScrollable?: boolean
    showBackButton?: boolean;
}

function Page(props: Props) {
    const {
        title,
        children,
        style,
        variant = 'normal',
        isScrollable = true,
        showBackButton = false,
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
            headerTintColor: theme.card,
        });
    }, [navigation, title, theme, showBackButton]);

    return (
        <SafeAreaView
            style={[
                styles.page,
                style,
            ]}
            edges={showBackButton ? ['bottom'] : undefined}
        >
            {isScrollable ? (
                <ScrollView>
                    {children}
                </ScrollView>
            ) : children}
        </SafeAreaView>
    );
}

export default Page;
