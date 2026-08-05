import { type IconSizeType } from '@/constants/size';
import { type ColorVariant } from '@/constants/theme';
import { type TextVariant } from '@/constants/typography';
import {
    type AlignType,
    type JustifyType,
} from '@/utils/layout';
import { type SpacingType } from '@/utils/styles';

import Button from './Button';
import { type ButtonWidthType } from './ButtonLayout';
import Icon, {
    type IconEmphasis,
    type IconName,
} from './Icon';
import Stack, { type GrowType } from './Stack';
import Text, { type TextAlignType } from './Text';

/** The whole treatment travels together, so a caller cannot pair a 96 pt mark with caption type. */
interface EmptyStateSize {
    iconSizeVariant: IconSizeType;
    iconEmphasis: IconEmphasis;
    titleVariant: TextVariant;
    descriptionVariant: TextVariant;
    /** Applied to both lines, so a wrapped description tracks its title. */
    textAlign: TextAlignType;
    align: AlignType;
    justify: JustifyType | undefined;
    grow: GrowType | undefined;
    spacing: SpacingType;
    /** `inset`, not `padding`: the raw-size lint rule matches that key by name alone. */
    inset: SpacingType;
    actionWidth: ButtonWidthType;
}

/**
 * `page` fills the screen, `inline` sits in a scrolling section, and `listRow` stands where a
 * row would, leading-aligned. `listRow` exists because that alignment is the one thing the other
 * two cannot express, and a free `align` prop would have been an escape hatch.
 */
const SIZE_VARIANT = {
    page: {
        iconSizeVariant: 'hero',
        iconEmphasis: 'strong',
        titleVariant: 'title',
        descriptionVariant: 'default',
        textAlign: 'center',
        align: 'center',
        justify: 'center',
        // 'slot' and not 'fill': the block is the whole screen and must be able to shrink
        // below its content, or a long description pushes the action off the bottom.
        grow: 'slot',
        spacing: 'md',
        inset: 'md',
        actionWidth: 'fill',
    },
    inline: {
        iconSizeVariant: '5xl',
        iconEmphasis: 'regular',
        titleVariant: 'default',
        descriptionVariant: 'label',
        textAlign: 'center',
        align: 'center',
        justify: undefined,
        grow: undefined,
        spacing: '2xs',
        inset: 'sm',
        actionWidth: 'hug',
    },
    listRow: {
        iconSizeVariant: 'md',
        iconEmphasis: 'regular',
        titleVariant: 'label',
        descriptionVariant: 'caption',
        textAlign: 'start',
        align: 'start',
        justify: undefined,
        grow: undefined,
        spacing: '4xs',
        // The list around it already carries the section padding.
        inset: 'none',
        actionWidth: 'hug',
    },
} as const satisfies Record<string, EmptyStateSize>;

export type EmptyStateSizeVariant = keyof typeof SIZE_VARIANT;

interface CommonProps {
    /**
     * Required, unlike everything else here. An empty state with no sentence is a blank area
     * with a glyph in it, which reads as a loading state that never finished.
     */
    title: string;

    /** The second line, explaining what to do about it. */
    description?: string;

    /** Required: the three are different shapes and none is the majority. */
    sizeVariant: EmptyStateSizeVariant;

    /** Defaults to `default`. `onBrand` is for a state sitting on the navy page. */
    colorVariant?: ColorVariant;

    /** Illustrative glyph above the title. Left out, the block is text only. */
    iconName?: IconName;

    /** Split from `colorVariant`: a green success mark over white text needs two colours. */
    iconColorVariant?: ColorVariant;

    testID?: string;
}

/** Whole or not at all: a label with no handler is inert, a handler with no label invisible. */
type EmptyStateAction = {
    /** Label on the button. Its presence is what draws one. */
    actionLabel: string;
    /** Required, not defaulted from the label: this button usually leaves the screen. */
    actionAccessibilityLabel: string;
    onActionPress: () => void;
    /** Left out, ui/ButtonLayout's own default applies. */
    actionColorVariant?: ColorVariant;
} | {
    actionLabel?: never;
    actionAccessibilityLabel?: never;
    onActionPress?: never;
    actionColorVariant?: never;
};

export type EmptyStateProps = CommonProps & EmptyStateAction;

/**
 * The "there is nothing here" block: a glyph, a title, a sentence and a way out.
 *
 * The button is composed here rather than taken as a node, so its width follows the rung:
 * full-width on a page state, hugging its label inline.
 */
function EmptyState(props: EmptyStateProps) {
    const {
        title,
        description,
        sizeVariant,
        colorVariant = 'default',
        iconName,
        iconColorVariant,
        actionLabel,
        actionAccessibilityLabel,
        onActionPress,
        actionColorVariant,
        testID,
    } = props;

    const size = SIZE_VARIANT[sizeVariant];

    return (
        <Stack
            spacing={size.spacing}
            padding={size.inset}
            align={size.align}
            justify={size.justify}
            grow={size.grow}
            testID={testID}
        >
            {iconName !== undefined && (
                <Icon
                    name={iconName}
                    sizeVariant={size.iconSizeVariant}
                    colorVariant={iconColorVariant ?? colorVariant}
                    emphasis={size.iconEmphasis}
                />
            )}
            <Text
                variant={size.titleVariant}
                colorVariant={colorVariant}
                align={size.textAlign}
            >
                {title}
            </Text>
            {description !== undefined && (
                <Text
                    variant={size.descriptionVariant}
                    colorVariant={colorVariant}
                    align={size.textAlign}
                >
                    {description}
                </Text>
            )}
            {actionLabel !== undefined && (
                <Button
                    title={actionLabel}
                    accessibilityLabel={actionAccessibilityLabel}
                    onPress={onActionPress}
                    colorVariant={actionColorVariant}
                    width={size.actionWidth}
                />
            )}
        </Stack>
    );
}

export default EmptyState;
