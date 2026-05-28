import {
    StyleSheet,
    View,
} from 'react-native';

import BlockListView from '@/components/BlockListView';
import Text from '@/components/Text';
import { SPACING_SM } from '@/constants/dimensions';

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: SPACING_SM,
    },
    iconSlot: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    textColumn: {
        flex: 1,
    },
});

interface Props {
    icon: React.ReactNode;
    title?: string;
    description: React.ReactNode;
    colorVariant?: 'normal' | 'brand';
}

function InstructionRow(props: Props) {
    const {
        icon, title, description, colorVariant = 'brand',
    } = props;

    return (
        <View style={styles.row}>
            <View style={styles.iconSlot}>
                {icon}
            </View>
            <BlockListView spacing="4xs" style={styles.textColumn}>
                {title && (
                    <Text variant="title" colorVariant={colorVariant}>
                        {title}
                    </Text>
                )}
                <Text colorVariant={colorVariant}>
                    {description}
                </Text>
            </BlockListView>
        </View>
    );
}

export default InstructionRow;
