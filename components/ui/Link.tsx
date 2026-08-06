import {
    type Href,
    Link as ExpoLink,
} from 'expo-router';

import { type ButtonSurfaceProps } from './Button';
import ButtonLayout from './ButtonLayout';

/**
 * ButtonLayout requires an onPress and a Link has none: expo-router injects the navigating press
 * at runtime. Verified safe rather than assumed: Slot's mergeProps chains the two, so this no-op
 * runs ahead of the navigation instead of replacing it. jest/setup.tsx leaves Link unmocked to
 * guard that.
 */
const navigationIsInjected = () => {};

export type LinkProps = ButtonSurfaceProps & {
    /**
     * Typed from the generated route tree, so a dead path is a compile error rather than a dead
     * tap. No `replace`/`push`/`dismissTo` yet; when one is needed it arrives as a single union.
     */
    href: Href;
};

/**
 * A Button whose action is a destination: the same ButtonLayout, only the trigger differs.
 *
 * `asChild` makes expo-router render a Slot, which merges everything it did not consume onto its
 * single child. That is how ButtonLayout receives the navigating `onPress` despite the no-op in
 * the JSX below, and it is also why props appearing to go to ExpoLink still reach the layout.
 */
function Link(props: LinkProps) {
    const {
        href,
        ...layoutProps
    } = props;

    return (
        <ExpoLink
            asChild
            href={href}
        >
            <ButtonLayout
                // `href` is the only key removed, and ExpoLink consumes it above.
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...layoutProps}
                onPress={navigationIsInjected}
            />
        </ExpoLink>
    );
}

export default Link;
