import { useMemo } from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

interface Props {
    availableInline: number;
    availableBlock?: number;

    fallbackInline?: number;
    fallbackBlock?: number;

    columns?: number;
    rows?: number;

    /** Taken off the extent before dividing, so it is not a per-tile value. */
    reserveInline?: number;
    reserveBlock?: number;

    minSize?: number;
}

function useFittedTileWidth(props: Props): number {
    const {
        availableInline,
        availableBlock,
        fallbackInline,
        fallbackBlock,
        columns = 1,
        rows = 1,
        reserveInline = 0,
        reserveBlock = 0,
        minSize,
    } = props;

    return useMemo(() => {
        // `||` not `??`: an extent of 0 means onLayout has not run, so the fallback applies.
        // Definedness, not value, decides whether the block axis constrains the fit.
        const constrainedByBlock = isDefined(availableBlock) || isDefined(fallbackBlock);
        const inline = availableInline || fallbackInline || 0;
        const block = availableBlock || fallbackBlock || 0;

        const inlineBudget = (inline - reserveInline) / columns;
        const fitted = constrainedByBlock
            ? Math.min(inlineBudget, (block - reserveBlock) / rows)
            : inlineBudget;

        if (isNotDefined(minSize)) {
            return fitted;
        }

        return Math.max(minSize, fitted);
    }, [
        availableInline,
        availableBlock,
        fallbackInline,
        fallbackBlock,
        columns,
        rows,
        reserveInline,
        reserveBlock,
        minSize,
    ]);
}

export default useFittedTileWidth;
