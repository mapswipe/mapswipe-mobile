import {
    type ReactElement,
    type Ref,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    FlatList,
    type LayoutChangeEvent,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    RefreshControl,
    type ViewStyle,
    type ViewToken,
} from 'react-native';
import {
    isDefined,
    isTruthyString,
} from '@togglecorp/fujs';

import Divider from '@/components/ui/Divider';
import Spinner from '@/components/ui/Spinner';
import Stack, { type GrowType } from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import {
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import {
    type AlignType,
    resolveBoxStyle,
} from '@/utils/layout';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

/**
 * `pager` snaps hard on purpose: with `pagingEnabled` alone a fast fling skips several pages,
 * which is never what a task swiper or a tutorial wants.
 */
const STYLE_VARIANT = {
    list: {
        horizontal: false,
        pagingEnabled: false,
        disableIntervalMomentum: false,
        decelerationRate: 'normal',
        withScrollIndicator: true,
    },
    pager: {
        horizontal: true,
        pagingEnabled: true,
        disableIntervalMomentum: true,
        decelerationRate: 'fast',
        withScrollIndicator: false,
    },
} as const satisfies Record<string, {
    horizontal: boolean;
    pagingEnabled: boolean;
    disableIntervalMomentum: boolean;
    decelerationRate: 'normal' | 'fast';
    withScrollIndicator: boolean;
}>;

export type ListViewStyleVariant = keyof typeof STYLE_VARIANT;

function RuleSeparator() {
    return <Divider />;
}

function RuleOnBrandSeparator() {
    return <Divider colorVariant="onBrand" />;
}

/** `ruleOnBrand` exists because the light-surface rule is invisible on the session navy. */
const SEPARATOR_COMPONENT = {
    rule: RuleSeparator,
    ruleOnBrand: RuleOnBrandSeparator,
} as const;

export type ListViewSeparatorType = keyof typeof SEPARATOR_COMPONENT;

/**
 * `heavyItems` is for the imagery pagers: a page of satellite tiles is expensive enough that
 * rendering ten ahead stalls the swipe. `default` emits nothing, keeping RN's own tuning.
 */
const VIRTUALIZATION = {
    default: { windowSize: undefined, initialNumToRender: undefined },
    heavyItems: { windowSize: 3, initialNumToRender: 2 },
} as const satisfies Record<string, {
    windowSize: number | undefined;
    initialNumToRender: number | undefined;
}>;

export type ListViewVirtualizationType = keyof typeof VIRTUALIZATION;

/**
 * Borrowed from Stack so the two agree: `slot` may shrink below its content, `fill` only takes
 * the leftover. The `satisfies Record<GrowType, ...>` breaks this file if Stack gains a rung.
 */
const GROW_STYLE = {
    slot: resolveBoxStyle({ flex: 1, minHeight: 0 }),
    fill: resolveBoxStyle({ flex: 1 }),
} as const satisfies Record<GrowType, ViewStyle>;

// Module scope, not a prop: RN throws on a viewabilityConfig whose identity changes.
const VIEWABILITY_CONFIG = {
    viewAreaCoveragePercentThreshold: 50,
};

/** One frame at 60Hz. */
const SCROLL_EVENT_THROTTLE = 16;

const MESSAGE_PADDING = 'lg' satisfies SpacingType;

const MESSAGE_GAP = '2xs' satisfies SpacingType;

/** The platform default is a mid-grey that disappears against both the navy and the page. */
const REFRESH_COLOR_VARIANT = 'brand' satisfies ColorVariant;

const STATE_COLOR = {
    pending: 'muted',
    errored: 'negative',
    empty: 'muted',
} as const satisfies Record<string, ColorVariant>;

interface ContentStyleOptions {
    spacing: SpacingType;
    padding: SpacingType | undefined;
    paddingBlock: SpacingType | undefined;
    paddingInline: SpacingType | undefined;
    align: AlignType | undefined;
    /** Grows the content box to the viewport so a state message can centre inside it. */
    withFilledContent: boolean;
}

function resolvePadding(padding: SpacingType | undefined): number | undefined {
    // getSpacingValue defaults an absent rung to 'md', so the guard is what keeps an unpadded
    // list unpadded.
    return padding === undefined ? undefined : getSpacingValue(padding);
}

function createContentStyle(options: ContentStyleOptions): ViewStyle {
    const {
        spacing,
        padding,
        paddingBlock,
        paddingInline,
        align,
        withFilledContent,
    } = options;

    return resolveBoxStyle({
        gap: getSpacingValue(spacing),
        // Yoga resolves the axis paddings over the shorthand by specificity rather than by key
        // order, so emitting all three is safe and the axis props win.
        padding: resolvePadding(padding),
        paddingBlock: resolvePadding(paddingBlock),
        paddingInline: resolvePadding(paddingInline),
        align,
        grow: withFilledContent ? 1 : undefined,
    });
}

/** Two methods rather than the FlatList ref, which would also expose the underlying ScrollView. */
export interface ListViewHandle {
    scrollToIndex: (options: { index: number; withAnimation?: boolean }) => void;
    scrollToOffset: (options: { offset: number; withAnimation?: boolean }) => void;
}

interface CommonProps<ITEM> {
    /** `undefined` and `null` both read as "nothing yet". */
    data: readonly ITEM[] | null | undefined;

    /** Takes the index too, for the sessions whose tasks carry no id of their own. */
    keySelector: (item: ITEM, index: number) => string;

    /** Returning `null` skips the row, e.g. a task whose imagery URL never arrived. */
    renderItem: (item: ITEM, index: number) => ReactElement | null;

    /**
     * Gap between rows; pass `none` for a pager, whose pages must butt together. With a
     * `separator` it is the clearance each side of the rule, so a separated list reads looser.
     */
    spacing: SpacingType;

    padding?: SpacingType;
    /** Each beats `padding` on its own axis. */
    paddingBlock?: SpacingType;
    paddingInline?: SpacingType;

    /** Left out, rows stretch, which is FlatList's own behaviour. */
    align?: AlignType;

    grow?: GrowType;

    /** Kept mounted through every state below, so it survives an empty body. */
    header?: ReactElement | null;
    footer?: ReactElement | null;

    /** Shown in place of the rows, so a populated list keeps its rows while it refetches. */
    pending?: boolean;
    pendingMessage?: string;

    /** Outranked by `pending`, since a retry in flight is the newer fact. */
    errored?: boolean;
    /** Without it the errored state renders nothing. */
    errorMessage?: string;

    /**
     * Shown when the list resolved to nothing. Conditional without a second flag: a caller that
     * must not claim emptiness yet passes `undefined`.
     */
    emptyMessage?: string;

    /**
     * Extent of one row along the scroll axis. Becomes `getItemLayout`, which is what lets
     * `scrollToIndex` reach an unrendered row. Only for lists whose rows are all one size.
     */
    itemSize?: number;

    /** For a pager whose snap interval is not its item size, e.g. tile columns per page. */
    snapOffsets?: readonly number[];

    /** Needs `itemSize`, or FlatList cannot find the offset. */
    initialIndex?: number;

    /** Freezes the scroll without unmounting, for a mode that owns the gesture itself. */
    withoutScrolling?: boolean;

    /** Defaults to `default`. */
    virtualization?: ListViewVirtualizationType;

    /** Re-renders the rows: `renderItem` closes over state the list cannot see. */
    extraData?: unknown;

    /** Fires as the content moves, with the offset along the scroll axis. */
    onScrollOffsetChange?: (offset: number) => void;

    /**
     * Fires once the fling settles. Distinct from the above: committing a page on every frame
     * would walk the index through every page the fling flew past.
     */
    onScrollSettle?: (offset: number) => void;

    /**
     * Index of the first row at least half in view. Must not swap between defined and undefined:
     * RN refuses a viewability handler that appears or changes after mount.
     */
    onVisibleIndexChange?: (index: number) => void;

    /** The list's own box. Sessions size their completion page to the viewport measured here. */
    onLayout?: (event: LayoutChangeEvent) => void;

    ref?: Ref<ListViewHandle>;

    testID?: string;
}

/**
 * Three props a horizontal pager cannot take, closed off rather than ignored: FlatList throws on
 * `numColumns` with `horizontal`, a rule would land inside the snap interval, and pull-to-refresh
 * has no axis to pull along.
 */
type ListViewShape = {
    /** Defaults to `list`. */
    styleVariant?: Extract<ListViewStyleVariant, 'list'>;

    /** The column gutter is `spacing`, so a grid stays square without a styled column wrapper. */
    numColumns?: number;

    separator?: ListViewSeparatorType;

    /** Pair with `refreshing`, or the indicator never retracts. */
    onRefresh?: () => void;
    refreshing?: boolean;
} | {
    styleVariant: Extract<ListViewStyleVariant, 'pager'>;
    numColumns?: never;
    separator?: never;
    onRefresh?: never;
    refreshing?: never;
};

export type ListViewProps<ITEM> = CommonProps<ITEM> & ListViewShape;

/**
 * Every list in the app, with somewhere to put a wait, a failure or an absence.
 *
 * The states draw through `ListEmptyComponent`, so they replace the rows but never the header or
 * footer: the projects screen keeps its banner and featured strip over an empty body.
 */
function ListView<ITEM>(props: ListViewProps<ITEM>) {
    const {
        data,
        keySelector,
        renderItem,
        spacing,
        padding,
        paddingBlock,
        paddingInline,
        align,
        grow,
        header,
        footer,
        pending,
        pendingMessage,
        errored,
        errorMessage,
        emptyMessage,
        itemSize,
        snapOffsets,
        initialIndex,
        withoutScrolling,
        virtualization = 'default',
        extraData,
        onScrollOffsetChange,
        onScrollSettle,
        onVisibleIndexChange,
        onLayout,
        ref,
        testID,
        styleVariant = 'list',
        numColumns,
        separator,
        onRefresh,
        refreshing,
    } = props;

    const theme = useTheme();
    const listRef = useRef<FlatList<ITEM>>(null);

    const {
        horizontal,
        pagingEnabled,
        disableIntervalMomentum,
        decelerationRate,
        withScrollIndicator,
    } = STYLE_VARIANT[styleVariant];

    const { windowSize, initialNumToRender } = VIRTUALIZATION[virtualization];

    useImperativeHandle(ref, () => ({
        scrollToIndex: (options) => {
            listRef.current?.scrollToIndex({
                index: options.index,
                animated: options.withAnimation ?? true,
            });
        },
        scrollToOffset: (options) => {
            listRef.current?.scrollToOffset({
                offset: options.offset,
                animated: options.withAnimation ?? true,
            });
        },
    }), []);

    const isEmpty = (data?.length ?? 0) === 0;
    const hasState = pending === true
        || (errored === true && isTruthyString(errorMessage))
        || isTruthyString(emptyMessage);

    const contentStyle = useMemo(() => createContentStyle({
        spacing,
        padding,
        paddingBlock,
        paddingInline,
        align,
        // Only while a state is actually on screen: a populated list whose content box grew to
        // the viewport would stretch its last row to fill the slack.
        withFilledContent: hasState && isEmpty,
    }), [spacing, padding, paddingBlock, paddingInline, align, hasState, isEmpty]);

    const columnStyle = useMemo(
        () => resolveBoxStyle({ gap: getSpacingValue(spacing) }),
        [spacing],
    );

    const listStyle = grow === undefined ? undefined : GROW_STYLE[grow];

    const stateContent = useMemo(() => {
        if (pending) {
            return (
                <Stack
                    spacing={MESSAGE_GAP}
                    padding={MESSAGE_PADDING}
                    align="center"
                    justify="center"
                    grow="fill"
                >
                    <Spinner accessibilityLabel={pendingMessage} />
                    {isTruthyString(pendingMessage) && (
                        <Text
                            variant="label"
                            colorVariant={STATE_COLOR.pending}
                            align="center"
                        >
                            {pendingMessage}
                        </Text>
                    )}
                </Stack>
            );
        }

        // A state with no message draws nothing: "no projects" on a failed fetch would be a lie.
        const message = errored ? errorMessage : emptyMessage;
        const colorVariant = errored ? STATE_COLOR.errored : STATE_COLOR.empty;

        if (!isTruthyString(message)) {
            return null;
        }

        return (
            <Stack
                spacing={MESSAGE_GAP}
                padding={MESSAGE_PADDING}
                align="center"
                justify="center"
                grow="fill"
            >
                <Text
                    variant="description"
                    colorVariant={colorVariant}
                    align="center"
                >
                    {message}
                </Text>
            </Stack>
        );
    }, [pending, pendingMessage, errored, errorMessage, emptyMessage]);

    const refreshControl = useMemo(() => {
        if (onRefresh === undefined) {
            return undefined;
        }

        const tint = resolveColor(theme, REFRESH_COLOR_VARIANT, 'content');

        return (
            <RefreshControl
                refreshing={refreshing ?? false}
                onRefresh={onRefresh}
                // iOS reads the first, Android the second, and neither falls back to the other.
                tintColor={tint}
                colors={[tint]}
            />
        );
    }, [onRefresh, refreshing, theme]);

    const handleKeyExtractor = useCallback(
        (item: ITEM, index: number) => keySelector(item, index),
        [keySelector],
    );

    const handleRenderItem = useCallback(
        ({ item, index }: { item: ITEM; index: number }) => renderItem(item, index),
        [renderItem],
    );

    // FlatList types snapToOffsets as a mutable array, so the readonly one the API takes is
    // copied rather than cast. Memoised, or the copy would be a new identity every render.
    const snapToOffsets = useMemo(
        () => (snapOffsets === undefined ? undefined : [...snapOffsets]),
        [snapOffsets],
    );

    const getItemLayout = useMemo(() => {
        if (itemSize === undefined) {
            return undefined;
        }

        return (_: ArrayLike<ITEM> | null | undefined, index: number) => ({
            length: itemSize,
            offset: itemSize * index,
            index,
        });
    }, [itemSize]);

    const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { x, y } = event.nativeEvent.contentOffset;
        onScrollOffsetChange?.(horizontal ? x : y);
    }, [horizontal, onScrollOffsetChange]);

    const handleMomentumScrollEnd = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { x, y } = event.nativeEvent.contentOffset;
            onScrollSettle?.(horizontal ? x : y);
        },
        [horizontal, onScrollSettle],
    );

    // RN throws "Changing onViewableItemsChanged on the fly is not supported", so the handler
    // keeps one identity for the life of the list and the ref carries the changing callback.
    const visibleIndexRef = useRef(onVisibleIndexChange);
    const [tracksVisibility] = useState(() => onVisibleIndexChange !== undefined);

    useEffect(() => {
        visibleIndexRef.current = onVisibleIndexChange;
    }, [onVisibleIndexChange]);

    const handleViewableItemsChanged = useCallback((info: {
        viewableItems: ViewToken<ITEM>[];
    }) => {
        const firstIndex = info.viewableItems[0]?.index;

        if (isDefined(firstIndex)) {
            visibleIndexRef.current?.(firstIndex);
        }
    }, []);

    // scrollToIndex throws when the target cell is unmeasured, which a windowed list hits on any
    // long jump. The average is approximate, but the alternative is a red box.
    const handleScrollToIndexFailed = useCallback((info: {
        index: number;
        averageItemLength: number;
    }) => {
        listRef.current?.scrollToOffset({
            offset: info.index * info.averageItemLength,
            animated: false,
        });
    }, []);

    return (
        <FlatList
            ref={listRef}
            testID={testID}
            data={data}
            keyExtractor={handleKeyExtractor}
            renderItem={handleRenderItem}
            extraData={extraData}
            style={listStyle}
            contentContainerStyle={contentStyle}
            // RN's own invariant: a column wrapper is rejected on a single-column list.
            columnWrapperStyle={isDefined(numColumns) && numColumns > 1 ? columnStyle : undefined}
            numColumns={numColumns}
            ListHeaderComponent={header}
            ListFooterComponent={footer}
            ListEmptyComponent={stateContent}
            ItemSeparatorComponent={separator === undefined
                ? undefined
                : SEPARATOR_COMPONENT[separator]}
            refreshControl={refreshControl}
            horizontal={horizontal}
            pagingEnabled={pagingEnabled}
            disableIntervalMomentum={disableIntervalMomentum}
            decelerationRate={decelerationRate}
            showsHorizontalScrollIndicator={horizontal && withScrollIndicator}
            showsVerticalScrollIndicator={!horizontal && withScrollIndicator}
            scrollEnabled={withoutScrolling !== true}
            snapToOffsets={snapToOffsets}
            getItemLayout={getItemLayout}
            initialScrollIndex={initialIndex}
            windowSize={windowSize}
            initialNumToRender={initialNumToRender}
            onScroll={onScrollOffsetChange === undefined ? undefined : handleScroll}
            scrollEventThrottle={SCROLL_EVENT_THROTTLE}
            onMomentumScrollEnd={onScrollSettle === undefined
                ? undefined
                : handleMomentumScrollEnd}
            onViewableItemsChanged={tracksVisibility ? handleViewableItemsChanged : undefined}
            viewabilityConfig={tracksVisibility ? VIEWABILITY_CONFIG : undefined}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            onLayout={onLayout}
        />
    );
}

export default ListView;
