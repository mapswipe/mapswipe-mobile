import { type ReactNode } from 'react';
import {
    View,
    type ViewStyle,
} from 'react-native';

import { BORDER_WIDTH_THIN } from '@/constants/border';
import { type AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import Box from './Box';
import Media, { type MediaSource } from './Media';
import Positioned from './Positioned';
import Row from './Row';
import Scrim from './Scrim';
import Stack from './Stack';
import Text from './Text';

/**
 * Read off the theme because no COLOR_ROLE border slot reaches `surfaceInverse`. Physical
 * `borderTopWidth` because RN ships `borderBlockStartColor` but no matching width.
 */
const createFooterStyle = (theme: AppTheme): ViewStyle => ({
    borderTopWidth: BORDER_WIDTH_THIN,
    borderTopColor: theme.surfaceInverse,
});

interface CommonProps {
    style?: never;
    /** The background image. Sized by Media's `hero` footprint: full width, HERO_HEIGHT tall. */
    source: MediaSource;

    /** The only content laid out here, because its colour must pin to the wash underneath. */
    title: string;

    action?: ReactNode;

    /** A label in here wants `onImage` and `flex="shrink"`, or it pushes the icons out. */
    footer?: ReactNode;

    testID?: string;
}

/**
 * Named for the image, because that is all it labels: the title announces itself. The opt-out
 * stays explicit, as on Media.
 */
type MediaHeaderLabelProps = {
    style?: never;
    imageAccessibilityLabel: string;
    withoutImageAccessibilityLabel?: never;
} | {
    imageAccessibilityLabel?: never;
    withoutImageAccessibilityLabel: true;
};

export type MediaHeaderProps = CommonProps & MediaHeaderLabelProps;

/**
 * The hero header: a full-bleed image, a dim over it, a centred title, and two optional slots.
 *
 * The overlay takes its extent by anchoring to the image rather than restating its height and
 * reading the window width: a header naming SCREEN_WIDTH is wrong the moment the app rotates.
 */
function MediaHeader(props: MediaHeaderProps) {
    const {
        source,
        title,
        action,
        footer,
        testID,
        imageAccessibilityLabel,
        withoutImageAccessibilityLabel,
    } = props;

    const footerStyle = useThemedStyles(createFooterStyle);

    return (
        <Box testID={testID}>
            {withoutImageAccessibilityLabel ? (
                <Media
                    source={source}
                    sizeVariant="hero"
                    withoutAccessibilityLabel
                />
            ) : (
                <Media
                    source={source}
                    sizeVariant="hero"
                    accessibilityLabel={imageAccessibilityLabel}
                />
            )}
            <Scrim colorVariant="medium" />
            {/* box-none: the wash and the empty space around the title are decoration, and only
                what the caller puts in the slots below should ever take a touch. */}
            <Positioned
                anchor="fill"
                pointerEvents="box-none"
            >
                <Stack
                    spacing="4xs"
                    grow="fill"
                >
                    <Stack
                        spacing="none"
                        grow="fill"
                        align="center"
                        justify="center"
                        padding="xs"
                    >
                        <Text
                            variant="heading"
                            colorVariant="onImage"
                            align="center"
                            withLegibilityShadow
                        >
                            {title}
                        </Text>
                    </Stack>
                    {footer !== undefined && (
                        <View style={footerStyle}>
                            <Scrim colorVariant="soft" />
                            <Row
                                spacing="3xs"
                                padding="3xs"
                            >
                                {footer}
                            </Row>
                        </View>
                    )}
                </Stack>
            </Positioned>
            {/* Last child and on its own layer, so the corner control stays above the wash on
                both platforms: Android compares elevation before paint order. */}
            {action !== undefined && (
                <Positioned
                    anchor="topStart"
                    // 4, so the glyph lands on the page's 16 gutter: IconButton centres a 16
                    // glyph in a 40 target. The eye lines up the arrow, not the touch box.
                    padding="4xs"
                    layer="controls"
                >
                    {action}
                </Positioned>
            )}
        </Box>
    );
}

export default MediaHeader;
