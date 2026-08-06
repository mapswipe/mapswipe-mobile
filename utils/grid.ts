/** Layout and this hit-test must share the same `width / gridSize` divisor. */
export function resolveGridCellIndex(options: {
    locationX: number;
    locationY: number;
    /** The tile's edge; square, so it bounds both axes. */
    width: number;
    gridSize: number;
}): number | undefined {
    const {
        locationX,
        locationY,
        width,
        gridSize,
    } = options;

    if (gridSize <= 0 || width <= 0) {
        return undefined;
    }

    if (
        locationX < 0 || locationY < 0
        || locationX >= width || locationY >= width
    ) {
        return undefined;
    }

    const cellSize = width / gridSize;
    const column = Math.floor(locationX / cellSize);
    const row = Math.floor(locationY / cellSize);

    // Floating-point division can put a touch a hair past the last cell.
    if (column < 0 || column >= gridSize || row < 0 || row >= gridSize) {
        return undefined;
    }

    return row * gridSize + column;
}

export function resolveVisibleColumnRange(options: {
    firstColumnIndex: number;
    columns: number;
    columnCount: number;
}): { startIndex: number; endIndex: number } | undefined {
    const { firstColumnIndex, columns, columnCount } = options;

    if (columns <= 0 || columnCount <= 0 || firstColumnIndex < 0) {
        return undefined;
    }

    const startIndex = Math.min(firstColumnIndex, columnCount - 1);

    return {
        startIndex,
        endIndex: Math.min(startIndex + columns - 1, columnCount - 1),
    };
}
