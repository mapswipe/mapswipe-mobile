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

/**
 * The box a page is laid into, handed to the caller as data, and the reason this component
 * exists: a horizontal list sizes items to their content on the block axis, so a tall page
 * grows past the screen. Measuring once and passing the numbers down removes that per-item style.
 */
export interface PageGeometry {
    width: number;
    height: number;
}

/** Everything a caller needs to place the reported index, without counting pages itself. */
export interface PagerPosition {
    /** Pages in total, the trailing page included when one is rendered. */
    pageCount: number;
    /** True when the page now showing is the appended trailing page rather than an item. */
    isTrailingPage: boolean;
}

/**
 * How a change to `index` is honoured. A long jump goes unanimated on purpose: animating it
 * renders every intermediate page. A user's own swipe is animated by the swipe either way.
 */
const SCROLL_ANIMATED = {
    animated: true,
    instant: false,
} as const;

export type PagerScrollBehavior = keyof typeof SCROLL_ANIMATED;

interface CommonProps<ITEM> {
    data: readonly ITEM[];
    keyExtractor: (item: ITEM, index: number) => string;

    /** Receives its box, so a page never states a size of its own. */
    renderPage: (item: ITEM, index: number, geometry: PageGeometry) => ReactNode;

    /**
     * A full-width page appended after the data, e.g. a session outro. Rendered only when there
     * is at least one item, so an empty group does not open on it.
     */
    renderTrailingPage?: (geometry: PageGeometry) => ReactNode;

    /** Setting it scrolls the pager; leaving it out lets the pager run uncontrolled. */
    index?: number;
    onIndexChange?: (index: number, position: PagerPosition) => void;

    /** Defaults to 'animated'. */
    scrollBehavior?: PagerScrollBehavior;

    /** Holds the user in place, e.g. on an unanswered scenario or mid-drag. */
    withPagingLocked?: boolean;

    /** For geometry a caller needs outside the pages, e.g. a floating bar beside the list. */
    onGeometryChange?: (geometry: PageGeometry) => void;

    testID?: string;
}

interface PageSizedProps {
    /** One item per page. `index` is both the page and the item. */
    sizeVariant: 'page';
    itemWidth?: never;
}

interface StripSizedProps {
    /**
     * Items narrower than a page, snapping at page boundaries. `index` counts pages, not items,
     * and the trailing page is padded out so the outro still snaps on an odd count.
     */
    sizeVariant: 'strip';
    /**
     * Measured geometry, so a number: the app's one strip divides it out of the viewport as
     * `min(width / 2, height / 4)`.
     */
    itemWidth: number;
}

export type PagerProps<ITEM> = CommonProps<ITEM> & (PageSizedProps | StripSizedProps);

/**
 * Horizontal paging list, and a thin one: the scrolling is ListView's `pager` rung. What is left
 * is measuring the slot the pages are dealt into and handing those numbers to the caller.
 */
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
    // The page showing now, as a ref rather than state: it is read by the scroll handler and by
    // the alignment effect to tell the user's own paging apart from a caller's, and rendering
    // does not depend on it.
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

    // A strip's items do not divide evenly into pages, so the pages it fills are counted from
    // the content width, and the shortfall becomes the filler that pushes the trailing page onto
    // the next boundary. Page-sized items are counted directly rather than divided out: a width
    // over itself lands a hair under a whole number often enough in floating point, and one
    // ceil() away from an extra empty page at the end of every session.
    const contentWidth = data.length * slotWidth;
    let contentPages = data.length;
    if (sizeVariant === 'strip') {
        contentPages = pageWidth <= 0 ? 0 : Math.ceil(contentWidth / pageWidth);
    }
    const trailingFiller = Math.round(contentPages * pageWidth - contentWidth);

    const hasTrailingPage = renderTrailingPage !== undefined && data.length > 0;
    const pageCount = contentPages + (hasTrailingPage ? 1 : 0);

    // Explicit stops rather than the variant's `pagingEnabled` alone: in a strip the paging
    // interval is not the item width, and pagingEnabled can only snap by the viewport's width.
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

    // Every frame of the scroll rather than the settle, because a caller that mirrors the page
    // into its own state must follow a drag the user has not let go of yet.
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
            // The first alignment and a re-measure after a rotation are corrections rather than
            // navigation, so they never animate however the caller paged.
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
                    // ListView's cells only repaint when a prop they watch changes, and the
                    // caller's closure is what carries the answers, the loading flags and the
                    // hide-tiles toggle into a page.
                    extraData={renderSlot}
                    // Pages butt together: any gap would land inside the snap interval.
                    spacing="none"
                    grow="slot"
                    footer={trailingPage}
                    itemSize={slotWidth}
                    snapOffsets={pageCount > 0 ? snapOffsets : undefined}
                    withoutScrolling={withPagingLocked}
                    // Pages are viewport-sized, so the default window would keep twenty full
                    // screens of maps and tiles mounted at once.
                    virtualization="heavyItems"
                    onScrollOffsetChange={handleScrollOffsetChange}
                />
            )}
        </Box>
    );
}

export default Pager;
