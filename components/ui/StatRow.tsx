import { type ColorVariant } from '@/constants/theme';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

import Badge, { type BadgeExtentVariant } from './Badge';
import Box from './Box';
import Row from './Row';
import Text from './Text';

/** Gap between the label and the value at the far end of the row. */
const CONTENT_SPACING: SpacingType = '2xs';

/**
 * Gap between the swatch and the label it belongs to. Tighter than the row's own gap on purpose:
 * a dot reads as part of its label, not as a third item on the line.
 */
const DOT_SPACING: SpacingType = '3xs';

const DOT_SIZE_VARIANT = '2xs' satisfies BadgeExtentVariant;

export interface StatRowProps {
    style?: never;
    /** What is being counted. */
    label: string;

    /** Already formatted for the locale. Optional: a row may carry its number in a Badge. */
    value?: string;

    /** Defaults to `default`. `onBrand` on the dark session surface. */
    colorVariant?: ColorVariant;

    /** Separate from the value's: the pair is a `secondary` label against a `default` value. */
    labelColorVariant?: ColorVariant;

    /** A token swatch before the label. The built-in "No" answer is `muted`, not a raw colour. */
    dotColorVariant?: ColorVariant;

    /**
     * Raw colour, forwarded untouched to Badge's `dotColor` where the pairing rule is enforced.
     * Author data off Firebase, so it can never be a token. Paints the swatch only.
     */
    dotColor?: string;

    testID?: string;
}

/**
 * A label and its value on one line, optionally led by a coloured swatch.
 *
 * Its stacked cousin is ui/InfoCard, not a variant of this. This row owns no outer inset:
 * rhythm between rows belongs to the Stack around them.
 */
function StatRow(props: StatRowProps) {
    const {
        label,
        value,
        colorVariant = 'default',
        labelColorVariant = 'secondary',
        dotColorVariant,
        dotColor,
        testID,
    } = props;

    return (
        <Row
            spacing={CONTENT_SPACING}
            justify="between"
            testID={testID}
        >
            <Box
                direction="row"
                align="center"
                gap={getSpacingValue(DOT_SPACING)}
                // Box rather than Row, for the shrink: Row has no shrink prop, and a flex child
                // that cannot shrink keeps its full content width, so a long answer label would
                // push the count off the end of the row instead of wrapping inside it.
                shrink={1}
            >
                {(dotColor !== undefined || dotColorVariant !== undefined) && (
                    <Badge
                        shape="circle"
                        sizeVariant={DOT_SIZE_VARIANT}
                        // The colour as a swatch, not as a surface with something on it.
                        styleVariant="swatch"
                        colorVariant={dotColorVariant}
                        dotColor={dotColor}
                    />
                )}
                <Text
                    variant="description"
                    colorVariant={labelColorVariant}
                    flex="shrink"
                >
                    {label}
                </Text>
            </Box>
            {value !== undefined && (
                <Text
                    // `value` is the 24pt tabular ramp: a count that ticks must not jitter.
                    variant="value"
                    colorVariant={colorVariant}
                >
                    {value}
                </Text>
            )}
        </Row>
    );
}

export default StatRow;
