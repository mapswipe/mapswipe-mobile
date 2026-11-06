import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    View,
} from 'react-native';

import BlockListView from '@/components/BlockListView';
import Icon from '@/components/Icon';
import Text, { ColorVariant } from '@/components/Text';
import { SPACING_SM } from '@/constants/dimensions';
import useTheme from '@/hooks/useTheme';

import InstructionRow from './InstructionRow';

const PANE_ICON_SIZE = 44;

const styles = StyleSheet.create({
    paneIcon: {
        width: PANE_ICON_SIZE,
        height: PANE_ICON_SIZE,
        borderRadius: 10,
        padding: 8,
        gap: 3,
    },
    paneBar: {
        flex: 1,
        borderRadius: 3,
        borderWidth: 1.5,
    },
    tip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING_SM,
        padding: SPACING_SM,
        borderRadius: 10,
        borderWidth: 1,
    },
    tipText: {
        flex: 1,
    },
});

interface PaneIconProps {
    // Which of the two stacked images this row describes
    highlight: 'top' | 'bottom';
    colorVariant: ColorVariant;
}

function PaneIcon(props: PaneIconProps) {
    const { highlight, colorVariant } = props;
    const theme = useTheme();

    const background = colorVariant === 'brand'
        ? theme.inputBrandBackground
        : theme.backgroundMuted;
    const foreground = colorVariant === 'brand'
        ? theme.textOnBrand
        : theme.primaryBlue;

    const getBarStyle = (position: 'top' | 'bottom') => [
        styles.paneBar,
        {
            borderColor: foreground,
            backgroundColor: position === highlight ? foreground : 'transparent',
        },
    ];

    return (
        <View style={[styles.paneIcon, { backgroundColor: background }]}>
            <View style={getBarStyle('top')} />
            <View style={getBarStyle('bottom')} />
        </View>
    );
}

interface Props {
    colorVariants?: ColorVariant;
}

// Explains the before/after layout of validate projects with pre-event imagery
function ValidateTwoViewInstructions(props: Props) {
    const { colorVariants = 'brand' } = props;
    const { t } = useTranslation('tutorialScreen');
    const theme = useTheme();

    const tipBorderColor = colorVariants === 'brand'
        ? theme.backgroundTrack
        : theme.border;
    const tipIconColor = colorVariants === 'brand'
        ? theme.textOnBrand
        : theme.primaryBlue;

    return (
        <BlockListView spacing="sm">
            <InstructionRow
                colorVariant={colorVariants}
                icon={<PaneIcon highlight="top" colorVariant={colorVariants} />}
                title={t('validateBefore')}
                description={t('validateBeforeDescription')}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={<PaneIcon highlight="bottom" colorVariant={colorVariants} />}
                title={t('validateAfter')}
                description={t('validateAfterDescription')}
            />
            <View style={[styles.tip, { borderColor: tipBorderColor }]}>
                <Icon
                    name="information-outline"
                    color={tipIconColor}
                    size={24}
                />
                <Text colorVariant={colorVariants} style={styles.tipText}>
                    {t('validateTwoViewTip')}
                </Text>
            </View>
        </BlockListView>
    );
}

export default ValidateTwoViewInstructions;
