export const RADIUS = {
    none: 0,
    '2xs': 4,
    xs: 6,
    sm: 8,
    md: 12,
    lg: 16,
    // React Native clamps a corner radius to half the shorter side, so a single
    // large value covers every pill and circle in the app (shipped variously as
    // 99, 999, '50%' and size / 2).
    full: 9999,
} as const;

export type RadiusType = keyof typeof RADIUS;
