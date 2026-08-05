import { useCallback } from 'react';

import ButtonLayout, { type ButtonLayoutProps } from './ButtonLayout';

/**
 * Distributive on purpose: ButtonLayoutProps is a union, and a plain `Omit` would flatten it so
 * that `<Button styleVariant="underline" padding="sm" />` started compiling.
 */
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/**
 * The whole of ButtonLayout except how it is triggered: a handler for Button, a destination for
 * Link. Exported rather than duplicated in Link.tsx so the two cannot drift.
 */
export type ButtonSurfaceProps = DistributiveOmit<ButtonLayoutProps, 'onPress'>;

/**
 * How one shared handler learns which row was pressed, without a fresh closure per row.
 *
 * A union rather than `name?: NAME`, which cannot be kept honest: the compiler would infer NAME
 * from the handler and then hand it an `undefined` it was promised was a string.
 */
type PressTarget<NAME> = {
    /** Handed back to `onPress`. Widened by `const`, so a literal stays a literal. */
    name: NAME;
    onPress: (name: NAME) => void;
} | {
    name?: never;
    onPress: () => void;
};

export type ButtonProps<NAME> = ButtonSurfaceProps & PressTarget<NAME>;

/**
 * A button. How it looks belongs to ButtonLayout and arrives through the spread.
 *
 * `onPress` is required: a button that does nothing still takes the touch and still reads as a
 * control, so it is indistinguishable from a broken one.
 */
function Button<const NAME = never>(props: ButtonProps<NAME>) {
    const {
        name,
        onPress,
        ...layoutProps
    } = props;

    const handlePress = useCallback(
        () => {
            // Both members of PressTarget are assignable to this: a handler that ignores its
            // argument may always be called with one. The cast is on the value, not the
            // function, and is only reachable on the branch where NAME is never.
            const press: (pressedName: NAME) => void = onPress;
            press(name as NAME);
        },
        [name, onPress],
    );

    return (
        <ButtonLayout
            // The type admits nothing but ButtonLayout's own props. `onPress` is the one key
            // removed and it is re-supplied below; `name` stops here, wrapped into the handler.
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...layoutProps}
            onPress={handlePress}
        />
    );
}

export default Button;
