import { renderHook } from '@testing-library/react-native';

import useSpacingToken from '@/hooks/useSpacingToken';
import {
    fullSpacings,
    gapSpacings,
    getSpacingValue,
    paddingSpacings,
    type SpacingType,
} from '@/utils/styles';

const SPACINGS: SpacingType[] = [
    'none', '4xs', '3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl',
];

describe('useSpacingToken', () => {
    it.each(SPACINGS)('writes the %s value onto every requested mode', (spacing) => {
        const { result } = renderHook(() => useSpacingToken({
            spacing,
            modes: fullSpacings,
        }));

        const expected = getSpacingValue(spacing);
        fullSpacings.forEach((mode) => {
            expect(result.current[mode]).toBe(expected);
        });
    });

    it.each([
        ['gap', gapSpacings],
        ['padding', paddingSpacings],
    ] as const)('emits only the %s modes', (_label, modes) => {
        const { result } = renderHook(() => useSpacingToken({ spacing: 'md', modes }));
        expect(Object.keys(result.current).sort()).toEqual([...modes].sort());
    });

    it('steps down the scale by index', () => {
        const { result } = renderHook(() => useSpacingToken({
            spacing: 'md',
            offset: -1,
            modes: fullSpacings,
        }));
        expect(result.current.paddingBlock).toBe(getSpacingValue('sm'));
    });

    it.each([-9, 9])('clamps an offset of %s to the ends of the scale', (offset) => {
        const { result } = renderHook(() => useSpacingToken({
            spacing: 'md',
            offset,
            modes: fullSpacings,
        }));
        const bound = offset < 0 ? getSpacingValue('none') : getSpacingValue('4xl');
        expect(result.current.paddingBlock).toBe(bound);
    });

    it('defaults to md on the padding modes', () => {
        const { result } = renderHook(() => useSpacingToken({}));
        expect(result.current.paddingBlock).toBe(getSpacingValue('md'));
        expect(result.current.rowGap).toBeUndefined();
    });
});
