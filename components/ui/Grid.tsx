import {
    Children,
    isValidElement,
    type ReactNode,
} from 'react';

import Box from '@/components/ui/Box';
import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import { type SpacingType } from '@/utils/styles';

/** A closed union rather than a number: a seven-column grid on a phone is a mistake. */
const COLUMN_COUNT = {
    two: 2,
    three: 3,
} as const;

export type GridColumnsType = keyof typeof COLUMN_COUNT;

export interface GridProps {
    children: ReactNode;
    /** Gap between columns and between rows alike. */
    spacing: SpacingType;
    columns?: GridColumnsType;
}

function chunk<T>(items: readonly T[], size: number): T[][] {
    return items.reduce<T[][]>((rows, item, index) => {
        if (index % size === 0) {
            rows.push([]);
        }
        rows[rows.length - 1].push(item);
        return rows;
    }, []);
}

/**
 * A grid of equal-width cells.
 *
 * Chunked into rows rather than using `flexWrap`, which cannot produce equal columns: wrap sizes
 * each item to its content before distributing the leftover space. Cells are `flex: 1`, which
 * zeroes flexBasis too, and a short last row is padded so its tile stays one column wide.
 *
 * The cell stretches to the tallest tile, but a child only fills that height if it says so:
 * a card-like child wants `flex="fill"`, without which the row comes out with ragged bottoms.
 */
function Grid(props: GridProps) {
    const {
        children,
        spacing,
        columns = 'two',
    } = props;

    const columnCount = COLUMN_COUNT[columns];
    const items = Children.toArray(children).filter(isValidElement);
    const rows = chunk(items, columnCount);

    return (
        <Stack spacing={spacing}>
            {rows.map((row, rowIndex) => (
                <Row
                    // Children.toArray gives every item a stable key, so the first cell's key
                    // identifies the row without falling back to its index.
                    key={row[0].key ?? `row-${rowIndex}`}
                    spacing={spacing}
                    // Cells match the tallest tile on the line, which is what lets a card pin
                    // its value to the bottom.
                    align="stretch"
                >
                    {row.map((item) => (
                        <Box key={item.key} flex={1}>
                            {item}
                        </Box>
                    ))}
                    {Array.from(
                        { length: columnCount - row.length },
                        (unused, fillerIndex) => (
                            <Box
                                key={`${row[0].key}-filler-${fillerIndex}`}
                                flex={1}
                            />
                        ),
                    )}
                </Row>
            ))}
        </Stack>
    );
}

export default Grid;
