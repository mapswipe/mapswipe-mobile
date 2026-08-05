// LocateTile's layout and its touch hit-test must share the same `width / gridSize` divisor.
import {
    resolveGridCellIndex,
    resolveVisibleColumnRange,
} from '@/utils/grid';

// Geometry measured on device.
const WIDTH = 979;
const GRID = 3;

function cellAt(locationX: number, locationY: number) {
    return resolveGridCellIndex({
        locationX,
        locationY,
        width: WIDTH,
        gridSize: GRID,
    });
}

describe('resolveGridCellIndex', () => {
    it('maps the top-left corner to cell 0', () => {
        expect(cellAt(0, 0)).toBe(0);
    });

    it('maps row-major, so the second column of the first row is 1', () => {
        expect(cellAt(WIDTH / 2, 1)).toBe(1);
    });

    it('maps the last cell to gridSize squared minus one', () => {
        expect(cellAt(WIDTH - 1, WIDTH - 1)).toBe(GRID * GRID - 1);
    });

    it.each([
        ['just inside a cell boundary', (WIDTH / GRID) - 0.01, 0],
        ['exactly on a cell boundary', WIDTH / GRID, 1],
        ['just past a cell boundary', (WIDTH / GRID) + 0.01, 1],
    ] as const)('%s', (_label, locationX, expected) => {
        expect(cellAt(locationX, 0)).toBe(expected);
    });

    it('covers every cell exactly once when sampling each cell centre', () => {
        const cellSize = WIDTH / GRID;
        const seen = new Set<number>();

        for (let row = 0; row < GRID; row += 1) {
            for (let column = 0; column < GRID; column += 1) {
                const index = cellAt(
                    (column + 0.5) * cellSize,
                    (row + 0.5) * cellSize,
                );
                expect(index).toBe(row * GRID + column);
                seen.add(index as number);
            }
        }

        expect(seen.size).toBe(GRID * GRID);
    });

    it.each([
        ['negative x', -1, 0],
        ['negative y', 0, -1],
        ['x on the trailing edge', WIDTH, 0],
        ['y on the trailing edge', 0, WIDTH],
        ['beyond the tile', WIDTH + 10, WIDTH + 10],
    ] as const)('rejects %s', (_label, locationX, locationY) => {
        expect(cellAt(locationX, locationY)).toBeUndefined();
    });

    it.each([
        ['a zero grid', 0],
        ['a negative grid', -3],
    ] as const)('rejects %s rather than dividing by it', (_label, gridSize) => {
        expect(resolveGridCellIndex({
            locationX: 10,
            locationY: 10,
            width: WIDTH,
            gridSize,
        })).toBeUndefined();
    });

    it('rejects an unmeasured tile', () => {
        expect(resolveGridCellIndex({
            locationX: 0,
            locationY: 0,
            width: 0,
            gridSize: GRID,
        })).toBeUndefined();
    });
});

describe('resolveVisibleColumnRange', () => {
    // Guards an off-by-one: a hardcoded `+ 1` rejects two columns of a three-column grid.
    it('spans exactly the columns on the page', () => {
        expect(resolveVisibleColumnRange({
            firstColumnIndex: 0,
            columns: 2,
            columnCount: 10,
        })).toEqual({ startIndex: 0, endIndex: 1 });

        expect(resolveVisibleColumnRange({
            firstColumnIndex: 0,
            columns: 3,
            columnCount: 10,
        })).toEqual({ startIndex: 0, endIndex: 2 });
    });

    it('follows the page along', () => {
        expect(resolveVisibleColumnRange({
            firstColumnIndex: 4,
            columns: 2,
            columnCount: 10,
        })).toEqual({ startIndex: 4, endIndex: 5 });
    });

    it('clamps a short last page to the final column', () => {
        expect(resolveVisibleColumnRange({
            firstColumnIndex: 8,
            columns: 3,
            columnCount: 9,
        })).toEqual({ startIndex: 8, endIndex: 8 });
    });

    it('clamps a first index past the end', () => {
        expect(resolveVisibleColumnRange({
            firstColumnIndex: 20,
            columns: 2,
            columnCount: 5,
        })).toEqual({ startIndex: 4, endIndex: 4 });
    });

    it.each([
        ['no columns per page', 0, 5],
        ['a negative column count', 2, -1],
    ] as const)('rejects %s', (_label, columns, columnCount) => {
        expect(resolveVisibleColumnRange({
            firstColumnIndex: 0,
            columns,
            columnCount,
        })).toBeUndefined();
    });
});
