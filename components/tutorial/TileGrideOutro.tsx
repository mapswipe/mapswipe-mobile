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
import TapBadgeIcon from './TapBadgeIcon';

const styles = StyleSheet.create({
    image: {
        width: 40,
        height: 40,
    },
});

function TileGridOutro() {
    const { t } = useTranslation('TutorialOutroScreen');
    const theme = useTheme();
    return (
        <BlockListView>
            <Text colorVariant="brand" variant="title">
                {t('dontWorryIfYoureUnsure')}
            </Text>
            <InstructionRow
                icon={(
                    <TapBadgeIcon
                        iconColor="#FFFFFF"
                        iconName="tap"
                        badgeNumber={2}
                        badgeColor={theme.success}
                    />
                )}
                description={t('youCanAlwaysTapTwice')}
            />
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
            <InstructionRow
                icon={<Icon name="hand-left-outline" color="#FFFFFF" size={40} />}
                description={t('holdZoom')}
            />
        </BlockListView>
    );
}

export default TileGridOutro;
