import {
    type ImageSourcePropType,
    type ImageStyle,
} from 'react-native';
import {
    Image,
    type ImageContentFit,
} from 'expo-image';

import { IMAGE_SIZE_MD } from '@/constants/dimensions';
import { RADIUS } from '@/constants/radius';
import {
    AVATAR_SIZE,
    HERO_HEIGHT,
    ICON_SIZE,
    LOGO_SIZE,
} from '@/constants/size';
import {
    type AppTheme,
    type ColorVariant,
    resolveColor,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

/**
 * A bundled asset or a backend URL, the only raw value here. Undefined is admitted because
 * those fields are optional and expo-image renders nothing for an absent source.
 */
export type MediaSource = ImageSourcePropType | string | undefined;

// Spanning the parent is the one extent no size token can express, and RN only accepts it as
// a percentage string. Named, because a bare '100%' is a size literal the lint rejects.
const FULL_EXTENT = '100%';

/** Square footprints, smallest first. Short on purpose: no size is picked by eye. */
const SQUARE_FOOTPRINT = {
    /** 24. The heart beside the contribution count in the project detail bottom bar. */
    xs: { width: ICON_SIZE['2xl'], height: ICON_SIZE['2xl'] },
    /** 40. The magnifier in TileGridOutro and ValidateOutro. */
    sm: { width: ICON_SIZE['5xl'], height: ICON_SIZE['5xl'] },
    /** 100. The level badge in ProfileHeader. */
    md: { width: AVATAR_SIZE, height: AVATAR_SIZE },
    /** 128. The app logo on login, register, OSM login and forgot-password. */
    lg: { width: LOGO_SIZE, height: LOGO_SIZE },
} as const satisfies Record<string, ImageStyle>;

/** Span the inline axis, block extent from a token. Separate: radius behaves differently. */
const SPAN_FOOTPRINT = {
    /** Full width, 200 tall: the TutorialIntroPage and TutorialInformationPage images. */
    illustration: { width: FULL_EXTENT, height: IMAGE_SIZE_MD },
    /** Full width, 240 tall: the banner at the top of the project detail page. */
    hero: { width: FULL_EXTENT, height: HERO_HEIGHT },
    /** Only correct under a parent that positions it, e.g. `<Positioned anchor="fill">`. */
    fill: { width: FULL_EXTENT, height: FULL_EXTENT },
} as const satisfies Record<string, ImageStyle>;

const SIZE_FOOTPRINT = { ...SQUARE_FOOTPRINT, ...SPAN_FOOTPRINT };

export type MediaSquareSizeType = keyof typeof SQUARE_FOOTPRINT;
export type MediaSpanSizeType = keyof typeof SPAN_FOOTPRINT;
export type MediaSizeType = keyof typeof SIZE_FOOTPRINT;

/** Corner treatments that read the same whatever the footprint. */
const OPEN_STYLE_VARIANT = {
    /** Square corners: the app logo, the heart, the project banner. */
    plain: { borderRadius: RADIUS.none },
    /** The tutorial illustrations, at one radius rather than the two they shipped with. */
    rounded: { borderRadius: RADIUS.sm },
} as const satisfies Record<string, ImageStyle>;

/**
 * RN clamps a radius to half the shorter side, so `full` is a circle on a square box and a
 * pill on anything else. Its own map is what offers it on the square sizes only.
 */
const SQUARE_STYLE_VARIANT = {
    circle: { borderRadius: RADIUS.full },
} as const satisfies Record<string, ImageStyle>;

const STYLE_VARIANT = { ...OPEN_STYLE_VARIANT, ...SQUARE_STYLE_VARIANT };

export type MediaStyleVariant = keyof typeof STYLE_VARIANT;
type MediaSpanStyleVariant = keyof typeof OPEN_STYLE_VARIANT;

/** Two of expo-image's five: the others distort or leave the bitmap at natural size. */
const CONTENT_FIT = {
    /** Fills the box and crops the overflow. expo-image's own default. */
    cover: 'cover',
    /** Fits the whole bitmap inside the box, letterboxing whichever axis is short. */
    contain: 'contain',
} as const satisfies Record<string, ImageContentFit>;

export type MediaFitType = keyof typeof CONTENT_FIT;

interface StyleOptions {
    sizeVariant: MediaSizeType;
    styleVariant: MediaStyleVariant;
    colorVariant: ColorVariant | undefined;
}

// One box, so this returns the style itself rather than a StyleSheet. Going through
// useThemedStyles also keeps the object identity stable between renders, which matters here:
// expo-image's Image is a PureComponent, and a fresh style object defeats it.
const createStyle = (theme: AppTheme, options: StyleOptions): ImageStyle => {
    const { sizeVariant, styleVariant, colorVariant } = options;

    return {
        ...SIZE_FOOTPRINT[sizeVariant],
        ...STYLE_VARIANT[styleVariant],
        backgroundColor: colorVariant === undefined
            ? undefined
            : resolveColor(theme, colorVariant, 'surface'),
    };
};

interface CommonProps {
    style?: never;
    source: MediaSource;
    /** Shows while a remote image loads and through a transparent asset. */
    colorVariant?: ColorVariant;
    /** How the bitmap maps into the box. Defaults to `cover`, as expo-image does. */
    fit?: MediaFitType;
    testID?: string;
}

/** A label, or an explicit statement that there is nothing to say. The opt-out is greppable. */
type MediaLabelProps = {
    style?: never;
    accessibilityLabel: string;
    withoutAccessibilityLabel?: never;
} | {
    /** The image adds nothing the surrounding text does not carry. A screen reader skips it. */
    withoutAccessibilityLabel: true;
    accessibilityLabel?: never;
};

type MediaShapeProps = {
    style?: never;
    /** Required: no option is the majority, so a default would be a guess. */
    sizeVariant: MediaSquareSizeType;
    /** Corner treatment. Defaults to `plain`. */
    styleVariant?: MediaStyleVariant;
} | {
    sizeVariant: MediaSpanSizeType;
    styleVariant?: MediaSpanStyleVariant;
};

export type MediaProps = CommonProps & MediaLabelProps & MediaShapeProps;

/**
 * The image primitive, over expo-image: the footprint is a token, and an image is either
 * labelled or explicitly decorative.
 *
 * Deliberately out of scope: the mapping flow's tiles, which are pressable, stack overlays and
 * drive a pinch-zoom. Media staying a childless leaf is what keeps it from growing into that.
 */
function Media(props: MediaProps) {
    const {
        source,
        sizeVariant,
        styleVariant = 'plain',
        colorVariant,
        fit = 'cover',
        accessibilityLabel,
        withoutAccessibilityLabel = false,
        testID,
    } = props;

    const style = useThemedStyles(createStyle, { sizeVariant, styleVariant, colorVariant });

    return (
        <Image
            source={source}
            style={style}
            contentFit={CONTENT_FIT[fit]}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole={withoutAccessibilityLabel ? undefined : 'image'}
            // Hiding a decoration takes all three: `accessible` stops it being a stop in the
            // reader's order, and the other two are the per-platform ways to take it out of
            // the tree, iOS first.
            accessible={!withoutAccessibilityLabel}
            accessibilityElementsHidden={withoutAccessibilityLabel}
            importantForAccessibility={withoutAccessibilityLabel ? 'no-hide-descendants' : 'yes'}
            testID={testID}
        />
    );
}

export default Media;
