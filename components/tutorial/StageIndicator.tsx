import {
    StyleSheet,
    View,
} from 'react-native';

import { SPACING_3XS } from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: SPACING_3XS,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.backgroundTrack,
    },
    activeDot: {
        backgroundColor: theme.textOnBrand,
        width: 16,
    },
});

interface Props {
    total: number;
    currentIndex: number;
}

function StageIndicator(props: Props) {
    const { total, currentIndex } = props;
    const styles = useThemedStyles(createStyles);

    return (
        <View style={styles.container}>
            {Array.from({ length: total }).map((_, i) => (
                <View
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    style={[styles.dot, i === currentIndex && styles.activeDot]}
                />
            ))}
        </View>
    );
}

export default StageIndicator;
