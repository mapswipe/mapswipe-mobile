import {
    Children,
    isValidElement,
    type ReactNode,
} from 'react';

import Box from '@/components/ui/Box';
import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import { type SpacingType } from '@/utils/styles';

const COLUMN_COUNT = {
    two: 2,
    three: 3,
} as const;

export type GridColumnsType = keyof typeof COLUMN_COUNT;

export interface GridProps {
    style?: never;
    children: ReactNode;
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

// Chunked into rows rather than `flexWrap`, which sizes each item to its content first and so
// cannot produce equal columns.
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
                    key={row[0].key ?? `row-${rowIndex}`}
                    spacing={spacing}
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
