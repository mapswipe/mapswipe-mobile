import { useTranslation } from 'react-i18next';

import Icon from '@/components/ui/Icon';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { FbObjCustomOption } from '@/utils/types';

import InstructionRow, {
    INSTRUCTION_CONTENT_COLOR,
    type InstructionColorVariant,
} from './InstructionRow';
import TapBadgeIcon from './TapBadgeIcon';

interface Props {
    customOptions?: FbObjCustomOption[];
    colorVariants? : InstructionColorVariant
}

function LocateInstructions(props: Props) {
    const { customOptions, colorVariants = 'brand' } = props;
    const { t } = useTranslation('instructionsScreen');
    const contentColorVariant = INSTRUCTION_CONTENT_COLOR[colorVariants];

    const tapOptions = (customOptions ?? [])
        .filter((option) => option.value > 0)
        .sort((a, b) => a.value - b.value);

    return (
        <Stack spacing="sm">
            <Text colorVariant={contentColorVariant}>
                {t('locateIntro')}
            </Text>

            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="hand-left-outline" colorVariant={contentColorVariant} sizeVariant="5xl" />}
                description={t('locateSwipe')}
            />

            {tapOptions.map((option) => (
                <InstructionRow
                    colorVariant={colorVariants}
                    key={option.value}
                    icon={(
                        <TapBadgeIcon
                            colorVariant={contentColorVariant}
                            iconName="tap"
                            badgeNumber={option.value}
                            // Author data off Firebase, so a raw colour and not a token.
                            badgeColor={option.iconColor}
                        />
                    )}
                    title={option.title}
                    description={option.description}
                />
            ))}

            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="tap" colorVariant={contentColorVariant} sizeVariant="5xl" />}
                description={t('locateTapReset')}
            />

            <Text weight="bold" colorVariant={contentColorVariant}>
                {t('locateMultiSelectSection')}
            </Text>

            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="selection" colorVariant={contentColorVariant} sizeVariant="5xl" />}
                description={t('locateMultiSelectDrag')}
            />

            <InstructionRow
                colorVariant={colorVariants}
                icon={<Icon name="check" colorVariant={contentColorVariant} sizeVariant="5xl" />}
                description={t('locateMultiSelectConfirm')}
            />
        </Stack>
    );
}

export default LocateInstructions;
