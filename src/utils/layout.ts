export const PIXELS_PER_MM = 3.78;
export const A4_HEIGHT_MM = 297;
export const GAP_HEIGHT_MM = 20;

export const A4_HEIGHT_PX = Math.ceil(A4_HEIGHT_MM * PIXELS_PER_MM);
export const GAP_HEIGHT_PX = Math.ceil(GAP_HEIGHT_MM * PIXELS_PER_MM);
export const VISUAL_PAGE_HEIGHT_PX = A4_HEIGHT_PX + GAP_HEIGHT_PX;

export const PAGE_MARGIN_TOP_MM = 15;
export const PAGE_MARGIN_TOP_PX = Math.ceil(PAGE_MARGIN_TOP_MM * PIXELS_PER_MM);

export const PAGE_BOTTOM_BUFFER_PX = 80;
