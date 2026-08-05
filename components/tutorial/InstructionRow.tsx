import { type ReactNode } from 'react';

import Box from '@/components/ui/Box';
import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { MEDALLION_SIZE } from '@/constants/size';
import { type ColorVariant } from '@/constants/theme';

// `brand` here means content on the navy pages, not ui's `brand` (the navy itself).
export type InstructionColorVariant = 'normal' | 'brand';

export const INSTRUCTION_CONTENT_COLOR = {
    normal: 'default',
    brand: 'onBrand',
} as const satisfies Record<InstructionColorVariant, ColorVariant>;

// Must match the size of the widest marker, the per-option disc in ValidateInstructions.
const MARKER_SLOT_WIDTH = MEDALLION_SIZE.md;

interface Props {
    icon: ReactNode;
    title?: string;
    description: ReactNode;
    colorVariant?: InstructionColorVariant;
}

function InstructionRow(props: Props) {
    const {
        icon, title, description, colorVariant = 'brand',
    } = props;

    const contentColorVariant = INSTRUCTION_CONTENT_COLOR[colorVariant];

    return (
        <Row
            spacing="sm"
            align="start"
        >
            <Box
                width={MARKER_SLOT_WIDTH}
                align="center"
                justify="start"
            >
                {icon}
            </Box>
            <Stack
                spacing="4xs"
                grow="fill"
            >
                {title && (
                    <Text
                        variant="title"
                        colorVariant={contentColorVariant}
                    >
                        {title}
                    </Text>
                )}
                <Text colorVariant={contentColorVariant}>
                    {description}
                </Text>
            </Stack>
        </Row>
    );
}

export default InstructionRow;
