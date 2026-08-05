import { type ReactNode } from 'react';

import Box from '@/components/ui/Box';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { type ColorVariant } from '@/constants/theme';
import { type TextVariant } from '@/constants/typography';
import { type SpacingType } from '@/utils/styles';

interface SectionLayout {
    /** Rung of the type scale the heading is drawn at. */
    titleVariant: TextVariant;
    /** One rung for the heading gap, the item gap and (with `withPadding`) the inset. */
    spacing: SpacingType;
}

/**
 * `default` is a settings-group heading over a list of rows; `compact` is a titled block nested
 * in a row or card, where the wider gap would break the pairing.
 *
 * Deliberately no page-title rung: the screen's name belongs to the screen, and a Section that
 * could impersonate one would put two page titles on a screen.
 */
const SIZE_VARIANT = {
    default: { titleVariant: 'title', spacing: 'xs' },
    compact: { titleVariant: 'subtitle', spacing: '4xs' },
} as const satisfies Record<string, SectionLayout>;

export type SectionSizeVariant = keyof typeof SIZE_VARIANT;

export interface SectionProps {
    /** A string, not a node: it is also the accessible name of the header landmark. */
    title: string;

    /** Siblings of the heading, not a wrapped group, so the section owns the rhythm once. */
    children: ReactNode;

    /** Defaults to `default`. See SIZE_VARIANT. */
    sizeVariant?: SectionSizeVariant;

    /**
     * Paints the heading, and only the heading: the content is an opaque subtree that colours
     * itself. `brand` is the one the tutorial pages need, where every section sits on navy.
     */
    colorVariant?: ColorVariant;

    /** Off by default: a section inside already-padded content must not pad again. */
    withPadding?: boolean;

    testID?: string;
}

function Section(props: SectionProps) {
    const {
        title,
        children,
        sizeVariant = 'default',
        colorVariant = 'default',
        withPadding = false,
        testID,
    } = props;

    const { titleVariant, spacing } = SIZE_VARIANT[sizeVariant];

    return (
        <Stack
            spacing={spacing}
            padding={withPadding ? spacing : undefined}
            testID={testID}
        >
            {/*
              * The wrapper is the only way to reach `header`: ui/Text sets accessibilityRole
              * itself and offers no prop for it, and a Text is not a heading to a screen
              * reader without one. `accessible` collapses the one Text below into that single
              * node, so the label is the title's own text and nothing is announced twice.
              */}
            <Box
                accessible
                accessibilityRole="header"
            >
                <Text
                    variant={titleVariant}
                    colorVariant={colorVariant}
                >
                    {title}
                </Text>
            </Box>
            {children}
        </Stack>
    );
}

export default Section;
