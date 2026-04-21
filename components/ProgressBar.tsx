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
    large: 10,
    thick: 14,
};

export type ColorVariant = 'normal' | 'brand' | 'green';
export type SizeVariant = 'thin' | 'medium' | 'large' | 'thick';

const createStyles = (theme: AppTheme, { sizeVariant, colorVariant }:
    { sizeVariant: SizeVariant; colorVariant: ColorVariant }) => {
    const height = SIZE_MAP[sizeVariant];
    const fillColorMap: Record<ColorVariant, string> = {
        normal: theme.backgroundBrand,
        brand: theme.textOnBrand,
        green: theme.primaryGreen,
    };

    return StyleSheet.create({
        track: {
            width: '100%',
            height,
            backgroundColor: colorVariant === 'green'
                ? theme.backgroundMuted : theme.backgroundTrack,
            overflow: 'hidden',
        },
        fill: {
            height: '100%',
            backgroundColor: fillColorMap[colorVariant],
        },
    });
};

type WithPercentage = {
    percentage: number;
    currentValue?: never;
    totalValue?: never;
};

type WithValues = {
    percentage?: never;
    currentValue: number;
    totalValue: number;
};

type ProgressProps = {
    colorVariant?: ColorVariant;
    sizeVariant?: SizeVariant;
};

type Props = ProgressProps & (WithPercentage | WithValues)

function ProgressBar(props: Props) {
    const {
        currentValue,
        totalValue,
        colorVariant = 'normal',
        sizeVariant = 'medium',
        percentage,
    } = props;

    const styles = useThemedStyles(createStyles, { sizeVariant, colorVariant });
    const currentPercentage = useMemo(() => {
        if (percentage !== undefined) {
            return Math.min(Math.max(percentage, 0), 1) * 100;
        }
        if (!totalValue || totalValue <= 0) return 0;
        return Math.min(Math.max(currentValue / totalValue, 0), 1) * 100;
    }, [percentage, currentValue, totalValue]);

    return (
        <View style={styles.track}>
            <View
                style={[
                    styles.fill,
                    { width: `${currentPercentage}%` },
                ]}
            />
        </View>
    );
}

export default ProgressBar;
