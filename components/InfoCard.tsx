import { Fragment } from 'react';
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
        justifyContent: 'space-between',
    },
    value: {
        alignItems: 'center',
    },

});

export type StatsInfo = {
    title: string,
    value: string | Array<{ value: string, unit: string }>,
};

type Props = {
    style?: ViewStyle;
} & StatsInfo;

function InfoCard(props: Props) {
    const {
        title, style, value,
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
            {typeof value === 'string' && (
                <Text variant="title">
                    {value}
                </Text>
            )}
            {Array.isArray(value) && (
                <InlineListView
                    spacing="4xs"
                    style={styles.value}
                >
                    {value.map((seg) => (
                        <Fragment key={seg.unit}>
                            <Text variant="title">
                                {seg.value}
                            </Text>
                            <Text variant="label">
                                {seg.unit}
                            </Text>
                        </Fragment>
                    ))}
                </InlineListView>
            )}

        </BlockListView>
    );
}

export default InfoCard;
