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

interface TileGridInstructionsProps {
    colorVariants? : InstructionColorVariant
}

function TileGridInstructions(props: TileGridInstructionsProps) {
    const { colorVariants = 'brand' } = props;
    const { t } = useTranslation('instructionsScreen');
    const contentColorVariant = INSTRUCTION_CONTENT_COLOR[colorVariants];

    return (
        <Stack spacing="sm">
            <Text colorVariant={contentColorVariant}>
                {t('tileGridIntro')}
            </Text>

            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="swipe-left" colorVariant={contentColorVariant} sizeVariant="5xl" />}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridSwipe">
                        If there&apos;s nothing relevant in the images, simply
                        <Text weight="bold" colorVariant={contentColorVariant}>swipe</Text>
                        to the next screen.
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
                    <Trans i18nKey="instructionsScreen:tileGridTapOnce">
                        If you see something in one of the images,
                        <Text weight="bold" colorVariant={contentColorVariant}>tap once</Text>
                        and the tile turns green.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={(
                    <TapBadgeIcon
                        iconName="tap"
                        colorVariant={contentColorVariant}
                        badgeNumber={2}
                        badgeColorVariant="notice"
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapTwice">
                        Not sure about what you see?
                        <Text weight="bold" colorVariant={contentColorVariant}>Tap twice</Text>
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
                        colorVariant={contentColorVariant}
                        badgeColorVariant="negative"
                    />
                )}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapThrice">
                        If there&apos;s an issue with the imagery,
                        <Text weight="bold" colorVariant={contentColorVariant}>tap three times</Text>
                        and the tile turns red.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="tap" colorVariant={contentColorVariant} sizeVariant="5xl" />}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapReset">
                        <Text weight="bold" colorVariant={contentColorVariant}>tap again</Text>
                        to return the tile to its original state.
                    </Trans>
                )}
            />
            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="hand-left-outline" colorVariant={contentColorVariant} sizeVariant="5xl" />}
                description={(
                    <Trans i18nKey="instructionsScreen:tileGridTapHold">
                        <Text weight="bold" colorVariant={contentColorVariant}>Tap and hold</Text>
                        to hide icons and overlay.
                    </Trans>
                )}
            />
        </Stack>
    );
}

export default TileGridInstructions;
