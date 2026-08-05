import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import Surface, { type SurfaceFlexType } from '@/components/ui/Surface';
import Text from '@/components/ui/Text';

export interface InfoCardSegment {
    /** Already formatted for the locale: this layer never sees a number. */
    value: string;
    /** The unit that follows it, e.g. 'h'. Also the key, so a run may not repeat a unit. */
    unit: string;
}

export interface InfoCardProps {
    /** The caption above the value. */
    label: string;
    value: string | readonly InfoCardSegment[];
    /** How the card claims space. Inside a Grid cell, `fill` is what makes it fill the height. */
    flex?: SurfaceFlexType;
    /** Measured geometry only. No percentage: it cannot see the gap between the columns. */
    width?: number;
    testID?: string;
}

/**
 * A small card holding one labelled value: the tiles a stats grid is made of.
 *
 * Its padding and internal rhythm are fixed, so no tile can breathe differently from its
 * neighbour. It does not lay out the grid: the only geometry it takes is how a parent hands
 * it space.
 */
function InfoCard(props: InfoCardProps) {
    const {
        label,
        value,
        flex,
        width,
        testID,
    } = props;

    return (
        <Surface
            padding="sm"
            flex={flex}
            width={width}
            testID={testID}
        >
            {/*
              * `fill` and `between` together are what pin the value to the bottom of the card, so
              * a two-line label on one tile does not leave its neighbours' numbers floating. The
              * segmented value used to escape that, because InlineListView's hardcoded flexGrow
              * let it swallow the free space instead.
              */}
            <Stack
                spacing="sm"
                grow="fill"
                justify="between"
            >
                <Text
                    variant="description"
                    colorVariant="secondary"
                >
                    {label}
                </Text>
                {typeof value === 'string' ? (
                    <Text variant="title">
                        {value}
                    </Text>
                ) : (
                    <Row
                        spacing="4xs"
                        wrap
                    >
                        {value.map((segment) => (
                            <Row
                                key={segment.unit}
                                spacing="4xs"
                            >
                                <Text variant="title">
                                    {segment.value}
                                </Text>
                                <Text
                                    variant="label"
                                    colorVariant="secondary"
                                >
                                    {segment.unit}
                                </Text>
                            </Row>
                        ))}
                    </Row>
                )}
            </Stack>
        </Surface>
    );
}

export default InfoCard;
