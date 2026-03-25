import { useMemo } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';

import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

const SIZE_MAP = {
    thin: 4,
    medium: 8,
    thick: 14,
};

export type ColorVariant = 'normal' | 'brand';
export type SizeVariant = 'thin' | 'medium' | 'thick';

const createStyles = (theme: AppTheme, { sizeVariant }: { sizeVariant: SizeVariant }) => {
    const height = SIZE_MAP[sizeVariant];

    return StyleSheet.create({
        track: {
            width: '100%',
            height,
            backgroundColor: theme.backgroundTrack,
            overflow: 'hidden',
        },
        fillNormal: {
            height: '100%',
            backgroundColor: theme.backgroundBrand,
        },
        fillBrand: {
            height: '100%',
            backgroundColor: theme.textOnBrand,
        },
    });
};

interface Props {
    currentValue: number;
    totalValue: number;
    colorVariant?: ColorVariant;
    sizeVariant?: SizeVariant;
}

function ProgressBar(props: Props) {
    const {
        currentValue,
        totalValue,
        colorVariant = 'normal',
        sizeVariant = 'medium',
    } = props;

    const styles = useThemedStyles(createStyles, { sizeVariant });

    const percentage = useMemo(() => {
        if (totalValue <= 0) return 0;
        return Math.min(Math.max(currentValue / totalValue, 0), 1) * 100;
    }, [currentValue, totalValue]);

    return (
        <View style={styles.track}>
            <View
                style={[
                    colorVariant === 'brand' ? styles.fillBrand : styles.fillNormal,
                    { width: `${percentage}%` },
                ]}
            />
        </View>
    );
}

export default ProgressBar;
