const PREVIEW_WIDTH = 280;
const PREVIEW_HEIGHT = 240;
const GAP = 12;

export const computeLibraryPreviewPosition = (anchorRect: DOMRect) => {
    let left = anchorRect.right + GAP;
    let top = anchorRect.top;

    if (left + PREVIEW_WIDTH > window.innerWidth - 8) {
        left = anchorRect.left - PREVIEW_WIDTH - GAP;
    }

    top = Math.min(top, window.innerHeight - PREVIEW_HEIGHT - 8);
    top = Math.max(8, top);

    return { left, top };
};
