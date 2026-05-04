import {
    Trans,
    useTranslation,
} from 'react-i18next';

import BlockListView from '@/components/BlockListView';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import useTheme from '@/hooks/useTheme';

import InstructionRow from './InstructionRow';
import TapBadgeIcon from './TapBadgeIcon';

const boldStyle = { fontWeight: 'bold' } as const;

function TileGridInstructions() {
    const { t } = useTranslation('instructionsScreen');
    const theme = useTheme();

    return (
        <BlockListView spacing="sm">
            <Text colorVariant="brand">
                {t('tileGridIntro')}
            </Text>

            <InstructionRow
                icon={<Icon name="swipe-left" color="#FFFFFF" size={40} />}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridSwipe">
                        If there&apos;s nothing relevant in the images, simply
                        <Text style={boldStyle} colorVariant="brand">swipe</Text>
                        to the next screen.
                    </Trans>
                )}
            />
            <InstructionRow
                icon={(
                    <TapBadgeIcon
                        iconName="tap"
                        badgeNumber={1}
                        badgeColor={theme.success}
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapOnce">
                        If you see something in one of the images,
                        <Text style={boldStyle} colorVariant="brand">tap once</Text>
                        and the tile turns green.
                    </Trans>
                )}
            />
            <InstructionRow
                icon={(
                    <TapBadgeIcon
                        iconName="tap"
                        badgeNumber={2}
                        badgeColor={theme.warning}
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapTwice">
                        Not sure about what you see?
                        <Text style={boldStyle} colorVariant="brand">Tap twice</Text>
                        and the tile turns yellow.
                    </Trans>
                )}
            />
            <InstructionRow
                icon={(
                    <TapBadgeIcon
                        iconName="tap"
                        badgeNumber={3}
                        badgeColor={theme.error}
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapThrice">
                        If there&apos;s an issue with the imagery,
                        <Text style={boldStyle} colorVariant="brand">tap three times</Text>
                        and the tile turns red.
                    </Trans>
                )}
            />
            <InstructionRow
                icon={<Icon name="tap" color="#FFFFFF" size={40} />}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapReset">
                        <Text style={boldStyle} colorVariant="brand">Tap again</Text>
                        to return the tile to its original state.
                    </Trans>
                )}
            />
            <InstructionRow
                icon={<Icon name="hand-left-outline" color="#FFFFFF" size={40} />}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapHold">
                        <Text style={boldStyle} colorVariant="brand">Tap and hold</Text>
                        to hide icons and overlay.
                    </Trans>
                )}
            />
        </BlockListView>
    );
}

export default TileGridInstructions;
