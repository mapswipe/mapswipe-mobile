import {
    StyleSheet,
    ViewStyle,
} from 'react-native';

import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import BlockListView from './BlockListView';
import InlineListView from './InlineListView';
import Text from './Text';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    infoCard: {
        backgroundColor: theme.card,
        flexGrow: 1,
    },
    value: {
        alignItems: 'center',
    },

});

type Props = {
    title: string,
    value: string,
    unit?: string,
    style?: ViewStyle,
};

function InfoCard(props: Props) {
    const {
        title, style, value, unit,
    } = props;
    const styles = useThemedStyles(createStyles);
    return (
        <BlockListView
            style={[styles.infoCard, style as ViewStyle]}
            withPadding
            spacing="sm"
        >
            <Text variant="description">
                {title}
            </Text>
            <InlineListView
                spacing="4xs"
                style={styles.value}
            >
                {typeof value === 'string' && (
                    <Text variant="title">
                        {value}
                    </Text>
                )}
                {unit && (
                    <Text variant="label">
                        {unit}
                    </Text>
                )}
            </InlineListView>

        </BlockListView>
    );
}

export default InfoCard;
