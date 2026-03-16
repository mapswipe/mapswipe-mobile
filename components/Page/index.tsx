import {
    ScrollView,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AppTheme } from '@/constants/theme';
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
    maxHeight?: boolean;
}

function Page(props: Props) {
    const {
        title,
        children,
        style,
        variant = 'normal',
        maxHeight,
    } = props;

    const styles = useThemedStyles(createStyles, { variant });

    return (
        <SafeAreaView
            style={[
                styles.page,
                style,
            ]}
        >
            {maxHeight ? (
                children
            ) : (
                <ScrollView>
                    {children}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

export default Page;
