import {
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: theme.background,
    },
});

interface Props {
    title: string;
    style?: ViewStyle,
    children: React.ReactNode;
    withFullWidthContent?: boolean;
}

function Page(props: Props) {
    const {
        title,
        children,
        style,
        withFullWidthContent,
    } = props;

    const styles = useThemedStyles(createStyles);

    return (
        <SafeAreaView
            style={[
                styles.page,
                style,
            ]}
        >
            {children}
        </SafeAreaView>
    );
}

export default Page;
