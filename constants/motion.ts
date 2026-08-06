import { Easing } from 'react-native';

// Animation durations in ms.
export const DURATION_INSTANT = 0;
export const DURATION_FAST = 100;
export const DURATION_SLOW = 250;
export const DURATION_AMBIENT = 3000;

// Spring physics, not milliseconds: the sheet settles on its own.
export const SPRING_SHEET = {
    tension: 80,
    friction: 12,
} as const;

export const SHEET_TRAVEL = 300;

export const EASING_AMBIENT = Easing.in(Easing.sin);
// Animated.timing's implicit default; reanimated instead defaults to inOut(quad).
export const EASING_DEFAULT = Easing.inOut(Easing.ease);
