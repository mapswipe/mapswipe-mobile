export interface RenderedImageBox {
    naturalWidth: number;
    naturalHeight: number;
    clientWidth: number;
    clientHeight: number;
}

export interface ProjectedBbox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Where a bbox in natural image coordinates lands after the image is letterboxed. */
export default function projectBbox(
    box: RenderedImageBox,
    bbox: readonly number[] | undefined,
): ProjectedBbox | undefined {
    const {
        naturalWidth,
        naturalHeight,
        clientWidth,
        clientHeight,
    } = box;

    if (!naturalWidth || !naturalHeight || !clientWidth || !clientHeight) {
        return undefined;
    }
    if (!bbox || bbox.length < 4) {
        return undefined;
    }

    const containerAspectRatio = clientWidth / clientHeight;
    const imageAspectRatio = naturalWidth / naturalHeight;

    // `contain` fit: only one axis is letterboxed, so only one excess is ever non-zero.
    const renderedHeight = imageAspectRatio > containerAspectRatio
        ? clientWidth / imageAspectRatio
        : clientHeight;

    const renderedWidth = containerAspectRatio > imageAspectRatio
        ? clientHeight * imageAspectRatio
        : clientWidth;

    const xExcess = clientWidth - renderedWidth;
    const yExcess = clientHeight - renderedHeight;

    const [x1, y1, w, h] = bbox;

    return {
        x: (x1 / naturalWidth) * renderedWidth + xExcess / 2,
        y: (y1 / naturalHeight) * renderedHeight + yExcess / 2,
        width: (w / naturalWidth) * renderedWidth,
        height: (h / naturalHeight) * renderedHeight,
    };
}
