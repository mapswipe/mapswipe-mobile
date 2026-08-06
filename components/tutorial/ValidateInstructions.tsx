import { useTranslation } from 'react-i18next';

import Badge from '@/components/ui/Badge';
import { type IconName } from '@/components/ui/Icon';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { FbObjCustomOption } from '@/utils/types';

import InstructionRow, {
    INSTRUCTION_CONTENT_COLOR,
    type InstructionColorVariant,
} from './InstructionRow';

interface Props {
    customOptions?: FbObjCustomOption[];
    colorVariants?: InstructionColorVariant
}

function ValidateInstructions(props: Props) {
    const { customOptions, colorVariants = 'brand' } = props;
    const { t } = useTranslation('instructionsScreen');
    const contentColorVariant = INSTRUCTION_CONTENT_COLOR[colorVariants];

    const options = customOptions ?? [];

    return (
        <Stack spacing="sm">
            <Text colorVariant={contentColorVariant}>
                {t('validateUseButtons')}
            </Text>
            {options.length === 0 ? (
                <Text colorVariant={contentColorVariant}>
                    {t('validateNoOptions')}
                </Text>
            ) : options.map((option) => (
                <InstructionRow
                    colorVariant={colorVariants}
                    key={option.value}
                    icon={(
                        <Badge
                            sizeVariant="2xl"
                            dotColor={option.iconColor}
                            // FIXME: No casting. Unvalidated glyph name off Firebase.
                            iconName={option.icon as IconName}
                        />
                    )}
                    title={option.title}
                    description={option.description}
                />
            ))}
        </Stack>
    );
}

export default ValidateInstructions;
