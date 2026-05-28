import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';

import MapswipeMagnifierImage from '@/assets/images/custom/mapswipe_magnifying_glass.png';
import useTheme from '@/hooks/useTheme';

import BlockListView from '../BlockListView';
import Icon from '../Icon';
import Text from '../Text';
import InstructionRow from './InstructionRow';

const ICON_PILL_SIZE = 35;

const styles = StyleSheet.create({
    image: {
        width: 40,
        height: 40,
    },
    pill: {
        width: ICON_PILL_SIZE,
        height: ICON_PILL_SIZE,
        borderRadius: ICON_PILL_SIZE / 2,
        borderColor: '#ffffff',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
function ValidateOutro() {
    const { t } = useTranslation('BFTutorialOutroScreen');
    const theme = useTheme();
    return (
        <BlockListView>
            <Text colorVariant="brand" variant="title">
                {t('dontWorryIfYoureUnsure')}
            </Text>
            <InstructionRow
                icon={(
                    <Image
                        source={MapswipeMagnifierImage}
                        style={styles.image}
                        contentFit="contain"
                    />
                )}
                description={t('everyImageViewedBy')}
            />
            <Text colorVariant="brand" variant="title">
                {t('wantToChangeYourAnswer')}
            </Text>
            <InstructionRow
                icon={<Icon name="swipe-right" color="#FFFFFF" size={40} />}
                description={t('youCanSwipeBack')}
            />
            <InstructionRow
                icon={(
                    <BlockListView
                        style={[styles.pill, { backgroundColor: theme.success }]}
                    >
                        <Icon
                            name="checkmark-outline"
                            color="#FFFFFF"
                            size={28}
                        />
                    </BlockListView>
                )}
                description={t('yourPreviousAnswerIsMarked')}
            />
        </BlockListView>
    );
}

export default ValidateOutro;
