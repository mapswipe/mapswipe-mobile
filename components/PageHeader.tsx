import React from 'react';
import {
    StyleSheet,
    ViewStyle,
} from 'react-native';

import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import BackButton from './BackButton';
import InlineListView from './InlineListView';
import Text from './Text';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    pageHeader: {
        backgroundColor: theme.primaryBlue,
        alignItems: 'center',
    },
    heading: {
        color: theme.card,
    },

});
interface Props {
    style?: ViewStyle;
    heading: string;
}

function PageHeader(props: Props) {
    const {
        style, heading,
    } = props;

    const styles = useThemedStyles(createStyles);

    return (
        <InlineListView
            style={[styles.pageHeader, ...(style ? [style] : [])]}
            withPadding
        >
            <BackButton />
            <Text
                variant="title"
                style={styles.heading}
            >
                {heading}
            </Text>
        </InlineListView>
    );
}

export default PageHeader;
