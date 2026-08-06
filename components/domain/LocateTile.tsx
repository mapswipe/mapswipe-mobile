import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from 'react';
import {
    type GestureResponderEvent,
    ImageBackground,
    PanResponder,
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

import {
    BORDER_WIDTH_HAIRLINE,
    BORDER_WIDTH_NONE,
    BORDER_WIDTH_SELECTION,
} from '@/constants/border';
import { OPACITY_MUTED } from '@/constants/opacity';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveGridCellIndex } from '@/utils/grid';
import { ResultOption } from '@/utils/types';

const createTileStyles = (
    theme: AppTheme,
    { width }: { width: number },
) => StyleSheet.create({
    tile: {
        position: 'relative',
        width,
        height: width,
        userSelect: 'none',
    },
    image: {
        width,
        height: width,
        borderColor: theme.mapBoundary,
        borderWidth: 1,
    },
    grid: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: width,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gestureOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height: width,
    },
});

const createCellStyles = (
    theme: AppTheme,
    { size, color, isSelected }: {
        size: number,
        color: string | undefined,
        isSelected: boolean,
    },
) => StyleSheet.create({
    cell: {
        width: size,
        height: size,
        position: 'relative',
    },
    tint: {
        ...StyleSheet.absoluteFill,
        backgroundColor: color,
        borderColor: theme.textOnPrimary,
        borderWidth: BORDER_WIDTH_HAIRLINE,
        opacity: OPACITY_MUTED,
    },
    selectionIndicator: {
        ...StyleSheet.absoluteFill,
        borderColor: theme.selectionRing,
        borderWidth: isSelected ? BORDER_WIDTH_SELECTION : BORDER_WIDTH_NONE,
    },
});

interface GridCellProps {
    cellIndex: number;
    size: number;
    color: string | undefined;
    isSelected: boolean;
    disabled: boolean;
    onPress: (cellIndex: number) => void;
}

function GridCell(props: GridCellProps) {
    const {
        cellIndex,
        size,
        color,
        isSelected,
        disabled,
        onPress,
    } = props;

    const styles = useThemedStyles(createCellStyles, { size, color, isSelected });

    const handlePress = useCallback(() => {
        onPress(cellIndex);
    }, [cellIndex, onPress]);

    return (
        <Pressable
            onPress={handlePress}
            disabled={disabled}
            style={styles.cell}
        >
            <View style={styles.tint} />
            <View style={styles.selectionIndicator} pointerEvents="none" />
        </Pressable>
    );
}

interface Props {
    url: string;
    width: number;
    gridSize: number;
    cellValues: number[];
    optionsByValue: Record<number, ResultOption>;
    onCellPress: (cellIndex: number) => void;

    selectedCells?: number[];
    selectionMode?: boolean;
    onCellSelect?: (cellIndex: number, action: 'select' | 'deselect') => void;
    isCellInteractive?: (cellIndex: number) => boolean;
}

function LocateTile(props: Props) {
    const {
        url,
        width,
        gridSize,
        cellValues,
        optionsByValue,
        onCellPress,
        selectedCells,
        selectionMode = false,
        onCellSelect,
        isCellInteractive,
    } = props;

    const styles = useThemedStyles(createTileStyles, { width });
    // Keep this divisor in sync with resolveGridCellIndex, which hit-tests taps the same way.
    const cellSize = width / gridSize;
    const selectedSet = useMemo(() => new Set(selectedCells ?? []), [selectedCells]);

    const gestureActionRef = useRef<'select' | 'deselect'>('select');
    const lastTouchedCellRef = useRef<number | undefined>(undefined);

    const latestRef = useRef({
        width,
        gridSize,
        selectedSet,
        onCellSelect,
    });
    useEffect(() => {
        latestRef.current = {
            width,
            gridSize,
            selectedSet,
            onCellSelect,
        };
    });

    const shouldSetResponder = useCallback(() => true, []);

    const handleGrant = useCallback((e: GestureResponderEvent) => {
        const latest = latestRef.current;
        if (!latest.onCellSelect) {
            return;
        }
        const { locationX, locationY } = e.nativeEvent;
        const idx = resolveGridCellIndex({
            locationX,
            locationY,
            width: latest.width,
            gridSize: latest.gridSize,
        });
        if (idx === undefined) {
            return;
        }
        gestureActionRef.current = latest.selectedSet.has(idx) ? 'deselect' : 'select';
        lastTouchedCellRef.current = idx;
        latest.onCellSelect(idx, gestureActionRef.current);
    }, []);

    const handleMove = useCallback((e: GestureResponderEvent) => {
        const latest = latestRef.current;
        if (!latest.onCellSelect) {
            return;
        }
        const { locationX, locationY } = e.nativeEvent;
        const idx = resolveGridCellIndex({
            locationX,
            locationY,
            width: latest.width,
            gridSize: latest.gridSize,
        });
        if (idx === undefined || idx === lastTouchedCellRef.current) {
            return;
        }
        lastTouchedCellRef.current = idx;
        latest.onCellSelect(idx, gestureActionRef.current);
    }, []);

    const handleReleaseOrTerminate = useCallback(() => {
        lastTouchedCellRef.current = undefined;
    }, []);

    // False positive: these handlers read the refs at gesture time, not during render.
    // eslint-disable-next-line react-hooks/refs
    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: shouldSetResponder,
        onStartShouldSetPanResponderCapture: shouldSetResponder,
        onMoveShouldSetPanResponder: shouldSetResponder,
        onMoveShouldSetPanResponderCapture: shouldSetResponder,
        onPanResponderGrant: handleGrant,
        onPanResponderMove: handleMove,
        onPanResponderRelease: handleReleaseOrTerminate,
        onPanResponderTerminate: handleReleaseOrTerminate,
    }), [shouldSetResponder, handleGrant, handleMove, handleReleaseOrTerminate]);

    return (
        <View style={styles.tile}>
            <ImageBackground
                source={{ uri: url }}
                style={styles.image}
            />
            <View style={styles.grid}>
                {cellValues.map((value, cellIndex) => (
                    <GridCell
                        // eslint-disable-next-line react/no-array-index-key
                        key={cellIndex}
                        cellIndex={cellIndex}
                        size={cellSize}
                        color={optionsByValue[value]?.color}
                        isSelected={selectedSet.has(cellIndex)}
                        disabled={isCellInteractive ? !isCellInteractive(cellIndex) : false}
                        onPress={onCellPress}
                    />
                ))}
            </View>
            {selectionMode && onCellSelect && (
                <View
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...panResponder.panHandlers}
                    style={styles.gestureOverlay}
                />
            )}
        </View>
    );
}

export default LocateTile;
