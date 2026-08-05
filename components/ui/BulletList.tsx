import { type ReactNode } from 'react';

import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { type ColorVariant } from '@/constants/theme';
import { type SpacingType } from '@/utils/styles';

/** U+2022, not an ASCII hyphen, which sits on the text baseline rather than beside it. */
const BULLET_MARKER = '•';

/** 4, the gap changeRow already uses between its marker and its text. */
const MARKER_GAP = '4xs' satisfies SpacingType;

/** 16, the rung the one live list gaps its entries by (`BlockListView spacing="xs"`). */
const ITEM_SPACING = 'xs' satisfies SpacingType;

export interface BulletListProps {
    /**
     * `ReactNode`, since entries are plain strings in some places and `<Trans>` in others.
     *
     * The marker is this component's, never the entry's. changeLog.json's 3.0.3 block starts
     * each string with '- ', so those entries draw two markers: fix the data, not this.
     */
    items: ReadonlyArray<ReactNode>;

    /** Paints both the markers and the entries. `brand` for the navy tutorial pages. */
    colorVariant?: ColorVariant;

    testID?: string;
}

/**
 * A list of bullets. The row aligns to `start` and the entry is the flexible child, so a wrapped
 * entry keeps its marker on the first line with its own lines aligned under each other.
 *
 * No icon-marker rung: per-entry markers need a slot per entry, which is a domain component.
 */
function BulletList(props: BulletListProps) {
    const {
        items,
        colorVariant = 'default',
        testID,
    } = props;

    return (
        <Stack
            spacing={ITEM_SPACING}
            testID={testID}
        >
            {items.map((item, index) => (
                <Row
                    // A bullet list is positional: entries have no identity, nothing reorders
                    // them, and a duplicate line of copy is legal. The index is the key.
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    spacing={MARKER_GAP}
                    align="start"
                >
                    <Text colorVariant={colorVariant}>
                        {BULLET_MARKER}
                    </Text>
                    <Text
                        colorVariant={colorVariant}
                        flex="fill"
                    >
                        {item}
                    </Text>
                </Row>
            ))}
        </Stack>
    );
}

export default BulletList;
