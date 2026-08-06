import {
    View,
    type ViewStyle,
} from 'react-native';

import Box from '@/components/ui/Box';
import { DOT_SIZE } from '@/constants/size';
import {
    type AppTheme,
    type ColorVariant,
    resolveColor,
    type ThemeColorKey,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveBoxStyle } from '@/utils/layout';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

const INACTIVE_COLOR = {
    onBrand: 'backgroundTrack',
    brand: 'textMuted',
} satisfies Partial<Record<ColorVariant, ThemeColorKey>>;

export type PageIndicatorColorVariant = keyof typeof INACTIVE_COLOR;

const ACTIVE_EXTENT_RATIO = {
    tinted: 1,
    expanded: 2,
} as const;

export type PageIndicatorStyleVariant = keyof typeof ACTIVE_EXTENT_RATIO;

const DOT_EXTENT = DOT_SIZE.sm;

interface PageIndicatorOptions {
    colorVariant: PageIndicatorColorVariant;
    styleVariant: PageIndicatorStyleVariant;
}

interface PageIndicatorStyles {
    dot: ViewStyle;
    activeDot: ViewStyle;
}

const createStyles = (theme: AppTheme, options: PageIndicatorOptions): PageIndicatorStyles => {
    const { colorVariant, styleVariant } = options;

    return {
        dot: {
            ...resolveBoxStyle({
                width: DOT_EXTENT,
                height: DOT_EXTENT,
                radius: 'full',
            }),
            backgroundColor: theme[INACTIVE_COLOR[colorVariant]],
        },
        activeDot: {
            // RN clamps a radius to half the shorter side, so `full` gives a circle or a capsule.
            ...resolveBoxStyle({
                width: DOT_EXTENT * ACTIVE_EXTENT_RATIO[styleVariant],
                height: DOT_EXTENT,
                radius: 'full',
            }),
            backgroundColor: resolveColor(theme, colorVariant, 'content'),
        },
    };
};

export interface PageIndicatorProps {
    style?: never;
    count: number;
    currentIndex: number;
    colorVariant: PageIndicatorColorVariant;
    styleVariant?: PageIndicatorStyleVariant;
    spacing?: SpacingType;
    accessibilityLabel?: string;
    testID?: string;
}

function PageIndicator(props: PageIndicatorProps) {
    const {
        count,
        currentIndex,
        colorVariant,
        styleVariant = 'tinted',
        spacing = '3xs',
        accessibilityLabel,
        testID,
    } = props;

    const styles = useThemedStyles(createStyles, { colorVariant, styleVariant });

    // Array.from reads a non-finite length as 0.
    const dots = Array.from({ length: Math.max(Math.trunc(count), 0) });

    return (
        <Box
            direction="row"
            justify="center"
            gap={getSpacingValue(spacing)}
            accessible={accessibilityLabel === undefined ? undefined : true}
            accessibilityLabel={accessibilityLabel}
            testID={testID}
        >
            {dots.map((_, index) => (
                <View
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    style={index === currentIndex ? styles.activeDot : styles.dot}
                />
            ))}
        </Box>
    );
}

export default PageIndicator;
