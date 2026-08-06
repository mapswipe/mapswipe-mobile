import { type RadiusType } from '@/constants/radius';
import { type IconSizeType } from '@/constants/size';
import {
    COLOR_ROLE,
    type ColorRole,
    type ColorVariant,
    type ThemeColorKey,
} from '@/constants/theme';
import { type TextVariant } from '@/constants/typography';
import { type SpacingType } from '@/utils/styles';

import Icon, { type IconName } from './Icon';
import Pressable from './Pressable';
import Row from './Row';
import Stack from './Stack';
import Surface, { type SurfaceStyleVariant } from './Surface';
import Text, { type TextAlignType } from './Text';

/**
 * The role whose `content` slot holds a given theme colour, or `never`.
 *
 * TODO: this and OnSurfaceLabelRole duplicate ButtonLayout's pair. A third consumer should move
 * them to constants/theme.ts beside COLOR_ROLE.
 */
type RoleWithContent<KEY extends ThemeColorKey> = {
    [ROLE in ColorVariant]: (typeof COLOR_ROLE)[ROLE]['content'] extends KEY ? ROLE : never;
}[ColorVariant];

/**
 * ui/Text resolves a ColorVariant through `content`, so a filled banner names the role already
 * carrying its onSurface colour. Where none exists, the entry widens to a free choice.
 */
type OnSurfaceLabelRole<ROLE extends ColorVariant> =
    [RoleWithContent<(typeof COLOR_ROLE)[ROLE]['onSurface']>] extends [never]
        ? ColorVariant
        : RoleWithContent<(typeof COLOR_ROLE)[ROLE]['onSurface']>;

/**
 * The fill and its label role together, so white-on-white cannot be asked for.
 *
 * `notice` takes `brand` rather than white: white on the amber surface measures about 1.9:1,
 * and the navy is the same in both themes where the theme's own `warningText` is not.
 */
const FILL_LABEL = {
    positive: 'onBrand',
    negative: 'onBrand',
    notice: 'brand',
    informative: 'onBrand',
    brand: 'onBrand',
} as const satisfies { [ROLE in ColorVariant]?: OnSurfaceLabelRole<ROLE> };

export type BannerColorVariant = keyof typeof FILL_LABEL;

interface BannerChrome {
    surface: SurfaceStyleVariant;
    /** Which slot the text, and with it the glyph, takes its colour from. */
    label: Extract<keyof ColorRole, 'content' | 'onSurface'>;
}

/**
 * Paint only: SIZE_VARIANT below owns the box.
 *
 * `outlined` is a card fill with the role surviving as ring and label, which no single
 * COLOR_ROLE entry expresses. It uses Surface's `outlinedStrong`, whose ring reads `content`
 * rather than the near-invisible grey of a `border` slot.
 */
const STYLE_VARIANT = {
    filled: { surface: 'flat', label: 'onSurface' },
    outlined: { surface: 'outlinedStrong', label: 'content' },
} as const satisfies Record<string, BannerChrome>;

export type BannerStyleVariant = keyof typeof STYLE_VARIANT;

interface BannerDensity {
    /** `inset`, not `padding`: the raw-size lint rule matches that property name alone. */
    inset: SpacingType;
    radius: RadiusType;
    /** Gap between the glyph and the text column. */
    space: SpacingType;
    /** Gap between the title and the message. */
    textSpace: SpacingType;
    /** Matched to the title's lineHeight, so the glyph is one line tall and sits square. */
    icon: IconSizeType;
    title: TextVariant;
    message: TextVariant;
}

/**
 * How tightly the strip is drawn. Radius travels with density rather than paint: a tighter box
 * wants a tighter corner.
 */
const SIZE_VARIANT = {
    default: {
        inset: 'xs',
        radius: 'md',
        space: '2xs',
        textSpace: '4xs',
        icon: '2xl',
        title: 'default',
        message: 'default',
    },
    compact: {
        inset: '2xs',
        radius: 'xs',
        space: '3xs',
        textSpace: '4xs',
        icon: 'xl',
        title: 'label',
        message: 'label',
    },
} as const satisfies Record<string, BannerDensity>;

export type BannerSizeVariant = keyof typeof SIZE_VARIANT;

interface CommonProps {
    style?: never;
    /** Always bold, and required: a bold single-line banner is a title with no message. */
    title: string;

    message?: string;

    iconName?: IconName;

    /** Required: a banner with no tone is a paragraph, and no role is the majority. */
    colorVariant: BannerColorVariant;

    /** Defaults to `filled`: the tutorial's three tones. Only the announcement is ringed. */
    styleVariant?: BannerStyleVariant;

    /** Defaults to `default`. See SIZE_VARIANT. */
    sizeVariant?: BannerSizeVariant;

    /** Defaults to `start`. `center` reads as a call to action rather than a sentence. */
    align?: TextAlignType;

    testID?: string;
}

/** Silent by default: its own text is what a screen reader reads. With onPress it is a target. */
type BannerPressProps = {
    style?: never;
    onPress?: never;
    accessibilityLabel?: never;
} | {
    onPress: () => void;
    /** Required with onPress: the strip's own text is rarely a usable destination. */
    accessibilityLabel: string;
};

export type BannerProps = CommonProps & BannerPressProps;

interface BannerPress {
    onPress: () => void;
    accessibilityLabel: string;
}

/** Takes `props` whole: a destructured `onPress` cannot narrow its paired accessibilityLabel. */
function resolvePress(props: BannerProps): BannerPress | undefined {
    if (props.onPress === undefined) {
        return undefined;
    }

    return {
        onPress: props.onPress,
        accessibilityLabel: props.accessibilityLabel,
    };
}

/**
 * The inline message strip: a tone, a glyph and a line or two of text on a painted or ringed box.
 *
 * Deliberately not a card: no children slot, no elevation, no width. A panel holding arbitrary
 * content is a Surface wrapping a Stack.
 */
function Banner(props: BannerProps) {
    const {
        title,
        message,
        iconName,
        colorVariant,
        styleVariant = 'filled',
        sizeVariant = 'default',
        align = 'start',
        testID,
    } = props;

    const paint = STYLE_VARIANT[styleVariant];
    const size = SIZE_VARIANT[sizeVariant];
    const press = resolvePress(props);

    const labelColorVariant = paint.label === 'onSurface'
        ? FILL_LABEL[colorVariant]
        : colorVariant;

    // The strip is the target when it is pressable, so the id has to land on the outermost box.
    const surfaceTestID = press === undefined ? testID : undefined;

    const body = (
        <Row
            spacing={size.space}
            align="start"
        >
            {iconName !== undefined && (
                <Icon
                    name={iconName}
                    sizeVariant={size.icon}
                    colorVariant={labelColorVariant}
                />
            )}
            <Stack
                spacing={size.textSpace}
                // So a long line wraps inside the column instead of pushing the glyph out.
                grow="fill"
            >
                <Text
                    variant={size.title}
                    weight="bold"
                    colorVariant={labelColorVariant}
                    align={align}
                >
                    {title}
                </Text>
                {message !== undefined && (
                    <Text
                        variant={size.message}
                        colorVariant={labelColorVariant}
                        align={align}
                    >
                        {message}
                    </Text>
                )}
            </Stack>
        </Row>
    );

    const strip = paint.surface === 'flat' ? (
        <Surface
            colorVariant={colorVariant}
            radius={size.radius}
            padding={size.inset}
            testID={surfaceTestID}
        >
            {body}
        </Surface>
    ) : (
        <Surface
            styleVariant={paint.surface}
            // The fill is the card and the role only rings it: see STYLE_VARIANT.
            colorVariant="default"
            borderColorVariant={colorVariant}
            radius={size.radius}
            padding={size.inset}
            testID={surfaceTestID}
        >
            {body}
        </Surface>
    );

    if (press === undefined) {
        return strip;
    }

    return (
        <Pressable
            onPress={press.onPress}
            accessibilityLabel={press.accessibilityLabel}
            testID={testID}
        >
            {strip}
        </Pressable>
    );
}

export default Banner;
