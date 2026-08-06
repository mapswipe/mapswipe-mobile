import {
    type ReactNode,
    useCallback,
} from 'react';

import { type IconSizeType } from '@/constants/size';
import { type ColorVariant } from '@/constants/theme';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

import Box from './Box';
import Icon, { type IconName } from './Icon';
import Pressable from './Pressable';
import Row from './Row';
import Surface from './Surface';
import Text from './Text';

const CONTENT_SPACING: SpacingType = 'xs';

/** Gap inside the trailing end, between a value and the glyph after it. */
const TRAILING_SPACING: SpacingType = '4xs';

interface ListRowSurface {
    /** Role whose `surface` paints the band. */
    fill: ColorVariant;
    /**
     * Foreground the caller may not override, or `undefined` where it is free to: a band that is
     * not the card colour has exactly one legible foreground.
     */
    pinnedContent: ColorVariant | undefined;
    /** For the trailing value and affordance glyph, never the title's chosen emphasis. */
    neutralContent: ColorVariant;
}

/** Where the band sits: `onBrand` is the language list over the brand-coloured page. */
const STYLE_VARIANT = {
    card: {
        fill: 'default',
        pinnedContent: undefined,
        neutralContent: 'default',
    },
    onBrand: {
        fill: 'brand',
        pinnedContent: 'onBrand',
        neutralContent: 'onBrand',
    },
} as const satisfies Record<string, ListRowSurface>;

export type ListRowStyleVariant = keyof typeof STYLE_VARIANT;

/** Derived, not listed, so a new band with a pinned foreground closes the prop automatically. */
type PinnedStyleVariant = {
    [VARIANT in ListRowStyleVariant]:
    (typeof STYLE_VARIANT)[VARIANT]['pinnedContent'] extends undefined ? never : VARIANT;
}[ListRowStyleVariant];

interface AffordanceGlyph {
    iconName: IconName;
    sizeVariant: IconSizeType;
    /** `undefined` takes the band's neutral foreground. */
    colorVariant: ColorVariant | undefined;
}

/**
 * What the tap promises, as the trailing glyph. A union, not a `withChevron` boolean: a chevron
 * that opens a browser is a lie. `external` pins `informative`, being louder than its title.
 */
const AFFORDANCE = {
    /** Pushes deeper into the app: the settings, user group and "change X" rows. */
    chevron: { iconName: 'caret-right', sizeVariant: 'sm', colorVariant: undefined },
    /** Leaves the app, for a browser or the mail client: the three link rows and "More Stats". */
    external: { iconName: 'sign-out', sizeVariant: 'lg', colorVariant: 'informative' },
    /** Marks the chosen row of a single-select list: the active locale. */
    selected: { iconName: 'checkmark-outline', sizeVariant: 'md', colorVariant: undefined },
} as const satisfies Record<string, AffordanceGlyph>;

export type ListRowAffordanceType = keyof typeof AFFORDANCE;

interface CommonProps {
    style?: never;
    /** The row's label, at 14pt regular: the same ramp all nine rows draw. */
    title: string;

    /** Required: a row whose trailing end carries the state announces half of itself otherwise. */
    accessibilityLabel: string;

    /** Leading glyph, drawn at the title's own 14pt so the pair sits on one baseline. */
    iconName?: IconName;

    /** Current state shown at the trailing end, before the affordance: the chosen language. */
    value?: string;

    /** What the tap does. See AFFORDANCE. */
    affordance?: ListRowAffordanceType;

    /**
     * Trailing content this layer cannot name, e.g. a Checkbox. Prefer `value` and `affordance`,
     * which cannot pick a colour the band makes illegible.
     */
    children?: ReactNode;

    testID?: string;
}

/**
 * How one shared handler learns which row was pressed, without a closure per row. A union rather
 * than an optional prop, so the argument and the value arrive together or not at all.
 */
type PressTarget<NAME> = {
    /** Handed back to `onPress`. Widened by `const`, so a literal stays a literal. */
    name: NAME;
    onPress: (name: NAME) => void;
} | {
    name?: never;
    onPress: () => void;
};

type ListRowPaint = {
    /** Defaults to `card`. */
    styleVariant?: Exclude<ListRowStyleVariant, PinnedStyleVariant>;
    /** Emphasis of the title and any leading icon. Defaults to `brand`. */
    colorVariant?: ColorVariant;
} | {
    styleVariant: PinnedStyleVariant;
    /** Pinned by the band. See ListRowSurface.pinnedContent. */
    colorVariant?: never;
};

export type ListRowProps<NAME> = CommonProps & ListRowPaint & PressTarget<NAME>;

const DEFAULT_EMPHASIS: ColorVariant = 'brand';

/** Outside the component: a destructured `styleVariant` cannot narrow whether it was allowed. */
function resolveTitleColorVariant<NAME>(props: ListRowProps<NAME>): ColorVariant {
    if (props.styleVariant === 'onBrand') {
        return STYLE_VARIANT.onBrand.pinnedContent;
    }

    return props.colorVariant ?? DEFAULT_EMPHASIS;
}

/**
 * A tappable row in a list of them: a settings row, a locale, a user group.
 *
 * The band is inside the Pressable rather than around it, so the whole row dims on touch.
 */
function ListRow<const NAME = never>(props: ListRowProps<NAME>) {
    const {
        title,
        accessibilityLabel,
        iconName,
        value,
        affordance,
        children,
        styleVariant = 'card',
        testID,
        name,
        onPress,
    } = props;

    const { fill, neutralContent } = STYLE_VARIANT[styleVariant];
    const titleColorVariant = resolveTitleColorVariant(props);

    const glyph = affordance === undefined ? undefined : AFFORDANCE[affordance];

    const handlePress = useCallback(
        () => {
            // Both members of PressTarget are assignable to this: a handler that ignores its
            // argument may always be called with one.
            const press: (pressedName: NAME) => void = onPress;
            press(name as NAME);
        },
        [name, onPress],
    );

    const hasTrailing = value !== undefined || children !== undefined || glyph !== undefined;

    return (
        <Pressable
            accessibilityLabel={accessibilityLabel}
            onPress={handlePress}
            testID={testID}
        >
            <Surface
                colorVariant={fill}
                padding={CONTENT_SPACING}
            >
                <Row
                    spacing={CONTENT_SPACING}
                    justify="between"
                >
                    <Box
                        direction="row"
                        align="center"
                        gap={getSpacingValue(CONTENT_SPACING)}
                        // Box rather than Row, for the shrink: Row has no shrink prop, and a
                        // flex child that cannot shrink keeps its full content width, so a long
                        // settings label would push the chevron off the end of the row.
                        shrink={1}
                    >
                        {iconName !== undefined && (
                            <Icon
                                name={iconName}
                                sizeVariant="sm"
                                colorVariant={titleColorVariant}
                            />
                        )}
                        <Text
                            // The list-row ramp: 14pt at regular weight, where `buttonLabel`'s
                            // own weight is bold. A row is not a button.
                            variant="buttonLabel"
                            weight="regular"
                            colorVariant={titleColorVariant}
                            flex="shrink"
                        >
                            {title}
                        </Text>
                    </Box>
                    {hasTrailing && (
                        <Row spacing={TRAILING_SPACING}>
                            {value !== undefined && (
                                <Text
                                    variant="buttonLabel"
                                    weight="regular"
                                    colorVariant={neutralContent}
                                >
                                    {value}
                                </Text>
                            )}
                            {children}
                            {glyph !== undefined && (
                                <Icon
                                    name={glyph.iconName}
                                    sizeVariant={glyph.sizeVariant}
                                    colorVariant={glyph.colorVariant ?? neutralContent}
                                />
                            )}
                        </Row>
                    )}
                </Row>
            </Surface>
        </Pressable>
    );
}

export default ListRow;
