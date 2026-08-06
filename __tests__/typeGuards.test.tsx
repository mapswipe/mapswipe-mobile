// Each `@ts-expect-error` is the assertion: if the boundary weakens, the unused directive fails.
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/jsx-props-no-spreading */
import { type ViewStyle } from 'react-native';

import Stack from '@/components/ui/Stack';
import Surface from '@/components/ui/Surface';
import Text from '@/components/ui/Text';

const leakedStyle: { style: ViewStyle } = { style: { backgroundColor: 'red' } };

describe('design system type boundary', () => {
    it('rejects a style attribute passed directly', () => {
        // @ts-expect-error - style is never: add a variant to the component instead
        const direct = <Text style={{ fontSize: 11 }}>x</Text>;

        expect(direct).toBeTruthy();
    });

    it('rejects a style smuggled in through an object spread', () => {
        // @ts-expect-error - style is never, which excess-property checking alone would miss
        const spreadText = <Text {...leakedStyle}>x</Text>;
        // @ts-expect-error - same, on a surface
        const spreadSurface = <Surface {...leakedStyle}>x</Surface>;
        // @ts-expect-error - same, on a layout primitive
        const spreadStack = <Stack spacing="sm" {...leakedStyle}>x</Stack>;

        expect(spreadText).toBeTruthy();
        expect(spreadSurface).toBeTruthy();
        expect(spreadStack).toBeTruthy();
    });

    it('requires an explicit spacing value on a stack', () => {
        // @ts-expect-error - spacing is required
        const noSpacing = <Stack>x</Stack>;

        expect(noSpacing).toBeTruthy();
    });

    it('rejects a variant that has no style branch', () => {
        // @ts-expect-error - not a TextVariant
        const badVariant = <Text variant="definitely-not-a-variant">x</Text>;

        expect(badVariant).toBeTruthy();
    });
});
