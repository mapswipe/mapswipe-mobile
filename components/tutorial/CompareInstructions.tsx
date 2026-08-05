import {
    Trans,
    useTranslation,
} from 'react-i18next';

import Icon from '@/components/ui/Icon';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';

import InstructionRow, {
    INSTRUCTION_CONTENT_COLOR,
    type InstructionColorVariant,
} from './InstructionRow';
import TapBadgeIcon from './TapBadgeIcon';

// A nested ui/Text sets fontSize outright, so a bold run must restate its parent's variant.

interface CompareInstructionsProps {
    colorVariants? : InstructionColorVariant
}

function CompareInstructions(props: CompareInstructionsProps) {
    const { colorVariants = 'brand' } = props;
    const { t } = useTranslation('instructionsScreen');
    const contentColorVariant = INSTRUCTION_CONTENT_COLOR[colorVariants];

    return (
        <Stack spacing="sm">
            <Text variant="title" colorVariant={contentColorVariant}>
                {t('compareYourTask')}
            </Text>
            <Text colorVariant={contentColorVariant}>
                <Trans i18nKey="instructionsScreen:compareLookingFor">
                    You&apos;re looking for
                    <Text weight="bold" colorVariant={contentColorVariant}>changes in buildings</Text>
                    . This acts as a clear indicator for a change in population size.
                </Trans>
            </Text>

            <Text variant="title" colorVariant={contentColorVariant}>
                {t('comparePerformTask')}
            </Text>

            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="swipe-left" colorVariant={contentColorVariant} sizeVariant="5xl" />}
                description={(
                    <Trans i18nKey="instructionsScreen:compareNoChanges">
                        If there are no changes, simply
                        <Text weight="bold" colorVariant={contentColorVariant}>swipe</Text>
                        to the next photos.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={(
                    <TapBadgeIcon
                        colorVariant={contentColorVariant}
                        iconName="tap"
                        badgeNumber={1}
                        badgeColorVariant="positive"
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:compareSeeChanges">
                        If you see a change in buildings,
                        <Text weight="bold" colorVariant={contentColorVariant}>tap once</Text>
                        and the tile turns green.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={(
                    <TapBadgeIcon
                        colorVariant={contentColorVariant}
                        iconName="tap"
                        badgeNumber={2}
                        badgeColorVariant="notice"
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:compareUnsure">
                        Unsure?
                        <Text weight="bold" colorVariant={contentColorVariant}>Tap twice</Text>
                        and the tile turns yellow.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={(
                    <TapBadgeIcon
                        colorVariant={contentColorVariant}
                        iconName="tap"
                        badgeNumber={3}
                        badgeColorVariant="negative"
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:compareBadImagery">
                        Imagery issue, like clouds covering the view?
                        <Text weight="bold" colorVariant={contentColorVariant}>Tap three times</Text>
                        and the tile turns red.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="hand-left-outline" colorVariant={contentColorVariant} sizeVariant="5xl" />}
                description={(
                    <Trans i18nKey="instructionsScreen:compareHideIcons">
                        <Text weight="bold" colorVariant={contentColorVariant}>Tap and hold</Text>
                        to hide icons and overlay.
                    </Trans>
                )}
            />

            <Text colorVariant={contentColorVariant}>
                {t('compareHoldZoom')}
            </Text>

            <Text variant="title" colorVariant={contentColorVariant}>
                {t('compareHint')}
            </Text>
            <Text colorVariant={contentColorVariant}>
                <Trans i18nKey="instructionsScreen:compareDifferentImagery">
                    Sometimes different imagery sources will have been used. The images
                    may be aligned slightly differently or might be a different resolution.
                    Remember, you&apos;re looking for
                    <Text weight="bold" colorVariant={contentColorVariant}>
                        definite changes in settlements and buildings
                    </Text>
                    — so if it looks like the same buildings are there but maybe
                    there&apos;s a new roof, that&apos;s a &apos;no change&apos; scenario
                    and you&apos;d simply swipe to the next image.
                </Trans>
            </Text>
        </Stack>
    );
}

export default CompareInstructions;
