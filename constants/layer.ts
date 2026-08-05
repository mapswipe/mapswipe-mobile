// On Android elevation can outrank zIndex, so a lifted view should set both to the same value.
export const LAYER_BASE = 0;
export const LAYER_CONTROLS = 20;
export const LAYER_OVERLAY = 40;
// In-tree modal surfaces only; react-native's Modal gets its own window and ignores zIndex.
export const LAYER_MODAL = 50;

export const layers = {
    base: LAYER_BASE,
    controls: LAYER_CONTROLS,
    overlay: LAYER_OVERLAY,
    modal: LAYER_MODAL,
} as const;

export type LayerType = keyof typeof layers;
