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

function CompareInstructions() {
    const { t } = useTranslation('instructionsScreen');
    const theme = useTheme();

    return (
        <BlockListView spacing="sm">
            <Text variant="title" colorVariant="brand">
                {t('compareYourTask')}
            </Text>
            <Text colorVariant="brand">
                <Trans i18nKey="instructionsScreen:compareLookingFor">
                    You&apos;re looking for
                    <Text style={boldStyle} colorVariant="brand">changes in buildings</Text>
                    . This acts as a clear indicator for a change in population size.
                </Trans>
            </Text>

            <Text variant="title" colorVariant="brand">
                {t('comparePerformTask')}
            </Text>

            <InstructionRow
                icon={<Icon name="swipe-left" color="#FFFFFF" size={40} />}
                description={(
                    <Trans i18nKey="instructionsScreen:compareNoChanges">
                        If there are no changes, simply
                        <Text style={boldStyle} colorVariant="brand">swipe</Text>
                        to the next photos.
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
                    <Trans i18nKey="instructionsScreen:compareSeeChanges">
                        If you see a change in buildings,
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
                    <Trans i18nKey="instructionsScreen:compareUnsure">
                        Unsure?
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
                    <Trans i18nKey="instructionsScreen:compareBadImagery">
                        Imagery issue, like clouds covering the view?
                        <Text style={boldStyle} colorVariant="brand">Tap three times</Text>
                        and the tile turns red.
                    </Trans>
                )}
            />
            <InstructionRow
                icon={<Icon name="hand-left-outline" color="#FFFFFF" size={40} />}
                description={(
                    <Trans i18nKey="instructionsScreen:compareHideIcons">
                        <Text style={boldStyle} colorVariant="brand">Tap and hold</Text>
                        to hide icons and overlay.
                    </Trans>
                )}
            />

            <Text colorVariant="brand">
                {t('compareHoldZoom')}
            </Text>

            <Text variant="title" colorVariant="brand">
                {t('compareHint')}
            </Text>
            <Text colorVariant="brand">
                <Trans i18nKey="instructionsScreen:compareDifferentImagery">
                    Sometimes different imagery sources will have been used. The images
                    may be aligned slightly differently or might be a different resolution.
                    Remember, you&apos;re looking for
                    <Text style={boldStyle} colorVariant="brand">
                        definite changes in settlements and buildings
                    </Text>
                    — so if it looks like the same buildings are there but maybe
                    there&apos;s a new roof, that&apos;s a &apos;no change&apos; scenario
                    and you&apos;d simply swipe to the next image.
                </Trans>
            </Text>
        </BlockListView>
    );
}

export default CompareInstructions;
