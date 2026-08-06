import {
    type ReactElement,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { type LayoutChangeEvent } from 'react-native';
import { bound } from '@togglecorp/fujs';

import Box from '@/components/ui/Box';
import ListView, { type ListViewHandle } from '@/components/ui/ListView';

export interface PageGeometry {
    width: number;
    height: number;
}

export interface PagerPosition {
    /** Includes the trailing page when one is rendered. */
    pageCount: number;
    isTrailingPage: boolean;
}

// `instant` exists because animating a long jump renders every intermediate page.
const SCROLL_ANIMATED = {
    animated: true,
    instant: false,
} as const;

export type PagerScrollBehavior = keyof typeof SCROLL_ANIMATED;

interface CommonProps<ITEM> {
    style?: never;
    data: readonly ITEM[];
    keyExtractor: (item: ITEM, index: number) => string;

    renderPage: (item: ITEM, index: number, geometry: PageGeometry) => ReactNode;

    /** Appended after the data, only when there is at least one item. */
    renderTrailingPage?: (geometry: PageGeometry) => ReactNode;

    index?: number;
    onIndexChange?: (index: number, position: PagerPosition) => void;

    scrollBehavior?: PagerScrollBehavior;

    withPagingLocked?: boolean;

    onGeometryChange?: (geometry: PageGeometry) => void;

    testID?: string;
}

interface PageSizedProps {
    style?: never;
    /** One item per page: `index` is both the page and the item. */
    sizeVariant: 'page';
    itemWidth?: never;
}

interface StripSizedProps {
    style?: never;
    /** Items narrower than a page: `index` still counts pages. */
    sizeVariant: 'strip';
    itemWidth: number;
}

export type PagerProps<ITEM> = CommonProps<ITEM> & (PageSizedProps | StripSizedProps);

function Pager<ITEM>(props: PagerProps<ITEM>) {
    const {
        data,
        keyExtractor,
        renderPage,
        renderTrailingPage,
        index,
        onIndexChange,
        scrollBehavior = 'animated',
        withPagingLocked,
        onGeometryChange,
        testID,
        sizeVariant,
        itemWidth,
    } = props;

    const listRef = useRef<ListViewHandle>(null);
    // A ref, not state: the scroll handler and the alignment effect read it, rendering does not.
    const currentIndexRef = useRef(0);
    const alignedRef = useRef(false);
    const lastWidthRef = useRef(0);

    const [pageWidth, setPageWidth] = useState(0);
    const [pageHeight, setPageHeight] = useState(0);

    const handleShellLayout = useCallback((event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;

        setPageWidth(width);
        setPageHeight(height);
    }, []);

    const pageGeometry = useMemo<PageGeometry>(
        () => ({ width: pageWidth, height: pageHeight }),
        [pageWidth, pageHeight],
    );

    useEffect(() => {
        if (pageGeometry.width <= 0) {
            return;
        }

        onGeometryChange?.(pageGeometry);
    }, [pageGeometry, onGeometryChange]);

    const slotWidth = sizeVariant === 'strip' ? itemWidth : pageWidth;

    const slotGeometry = useMemo<PageGeometry>(
        () => ({ width: slotWidth, height: pageHeight }),
        [slotWidth, pageHeight],
    );

    // Page-sized items are counted directly, never divided out: ceil(width / width) rounds up in
    // floating point and adds an empty page at the end.
    const contentWidth = data.length * slotWidth;
    let contentPages = data.length;
    if (sizeVariant === 'strip') {
        contentPages = pageWidth <= 0 ? 0 : Math.ceil(contentWidth / pageWidth);
    }
    const trailingFiller = Math.round(contentPages * pageWidth - contentWidth);

    const hasTrailingPage = renderTrailingPage !== undefined && data.length > 0;
    const pageCount = contentPages + (hasTrailingPage ? 1 : 0);

    // Explicit stops: `pagingEnabled` can only snap by the viewport width, which a strip is not.
    const snapOffsets = useMemo(
        () => Array.from({ length: pageCount }, (_, page) => page * pageWidth),
        [pageCount, pageWidth],
    );

    const renderSlot = useCallback((item: ITEM, itemIndex: number) => (
        <Box
            width={slotGeometry.width}
            height={slotGeometry.height}
        >
            {renderPage(item, itemIndex, slotGeometry)}
        </Box>
    ), [renderPage, slotGeometry]);

    // Fires during the drag, not on the settle, so a caller mirroring the index keeps up.
    const handleScrollOffsetChange = useCallback((offset: number) => {
        if (pageWidth <= 0 || pageCount === 0) {
            return;
        }

        const nextIndex = bound(Math.round(offset / pageWidth), 0, pageCount - 1);

        if (nextIndex === currentIndexRef.current) {
            return;
        }

        currentIndexRef.current = nextIndex;
        onIndexChange?.(nextIndex, {
            pageCount,
            isTrailingPage: hasTrailingPage && nextIndex === pageCount - 1,
        });
    }, [pageWidth, pageCount, hasTrailingPage, onIndexChange]);

    useEffect(() => {
        if (pageWidth <= 0) {
            return;
        }

        const target = index ?? currentIndexRef.current;
        const widthChanged = lastWidthRef.current !== pageWidth;
        const wasAligned = alignedRef.current;

        if (wasAligned && !widthChanged && target === currentIndexRef.current) {
            return;
        }

        lastWidthRef.current = pageWidth;
        alignedRef.current = true;
        currentIndexRef.current = target;

        listRef.current?.scrollToOffset({
            offset: target * pageWidth,
            // First alignment and a re-measure are corrections, not navigation, so never animated.
            withAnimation: wasAligned && !widthChanged && SCROLL_ANIMATED[scrollBehavior],
        });
    }, [index, pageWidth, scrollBehavior]);

    let trailingPage: ReactElement | null = null;
    if (hasTrailingPage) {
        const page = (
            <Box
                width={pageGeometry.width}
                height={pageGeometry.height}
            >
                {renderTrailingPage(pageGeometry)}
            </Box>
        );

        trailingPage = trailingFiller > 0
            ? (
                <Box direction="row">
                    <Box width={trailingFiller} />
                    {page}
                </Box>
            )
            : page;
    }

    return (
        <Box
            flex={1}
            minHeight={0}
            onLayout={handleShellLayout}
            testID={testID}
        >
            {pageWidth > 0 && (
                <ListView
                    ref={listRef}
                    styleVariant="pager"
                    data={data}
                    keySelector={keyExtractor}
                    renderItem={renderSlot}
                    // Cells only repaint on a watched prop, and renderSlot carries the page state.
                    extraData={renderSlot}
                    // Pages butt together: any gap would land inside the snap interval.
                    spacing="none"
                    grow="slot"
                    footer={trailingPage}
                    itemSize={slotWidth}
                    snapOffsets={pageCount > 0 ? snapOffsets : undefined}
                    withoutScrolling={withPagingLocked}
                    // Pages are viewport-sized, so the default window would mount twenty screens.
                    virtualization="heavyItems"
                    onScrollOffsetChange={handleScrollOffsetChange}
                />
            )}
        </Box>
    );
}

export default Pager;
