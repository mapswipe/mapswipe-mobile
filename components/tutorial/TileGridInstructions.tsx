import {
    Trans,
    useTranslation,
} from 'react-i18next';

import BlockListView from '@/components/BlockListView';
import Icon from '@/components/Icon';
import Text, { colorVariant } from '@/components/Text';
import useTheme from '@/hooks/useTheme';

import InstructionRow from './InstructionRow';
import TapBadgeIcon from './TapBadgeIcon';

const boldStyle = { fontWeight: 'bold' } as const;

interface TileGridInstructionsProps {
    colorVariants? : colorVariant
}

function TileGridInstructions(props: TileGridInstructionsProps) {
    const { colorVariants = 'brand' } = props;
    const { t } = useTranslation('instructionsScreen');
    const theme = useTheme();

    const iconColor = colorVariants === 'brand' ? '#FFFFFF' : '#000000';

    return (
        <BlockListView spacing="sm">
            <Text colorVariant={colorVariants}>
                {t('tileGridIntro')}
            </Text>

            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="swipe-left" color={iconColor} size={40} />}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridSwipe">
                        If there&apos;s nothing relevant in the images, simply
                        <Text style={boldStyle} colorVariant={colorVariants}>swipe</Text>
                        to the next screen.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={(
                    <TapBadgeIcon
                        iconColor={iconColor}
                        iconName="tap"
                        badgeNumber={1}
                        badgeColor={theme.success}
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapOnce">
                        If you see something in one of the images,
                        <Text style={boldStyle} colorVariant={colorVariants}>tap once</Text>
                        and the tile turns green.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={(
                    <TapBadgeIcon
                        iconName="tap"
                        iconColor={iconColor}
                        badgeNumber={2}
                        badgeColor={theme.warning}
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapTwice">
                        Not sure about what you see?
                        <Text style={boldStyle} colorVariant={colorVariants}>Tap twice</Text>
                        and the tile turns yellow.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={(
                    <TapBadgeIcon
                        iconName="tap"
                        badgeNumber={3}
                        iconColor={iconColor}
                        badgeColor={theme.error}
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapThrice">
                        If there&apos;s an issue with the imagery,
                        <Text style={boldStyle} colorVariant={colorVariants}>tap three times</Text>
                        and the tile turns red.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="tap" color={iconColor} size={40} />}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapReset">
                        <Text style={boldStyle} colorVariant={colorVariants}>tap again</Text>
                        to return the tile to its original state.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="hand-left-outline" color={iconColor} size={40} />}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapHold">
                        <Text style={boldStyle} colorVariant={colorVariants}>Tap and hold</Text>
                        to hide icons and overlay.
                    </Trans>
                )}
            />
        </BlockListView>
    );
}

export default TileGridInstructions;
