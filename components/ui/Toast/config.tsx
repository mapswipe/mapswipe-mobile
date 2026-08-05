import {
    type ToastConfig,
    type ToastConfigParams,
} from 'react-native-toast-message';
import { isTruthyString } from '@togglecorp/fujs';

import { BORDER_WIDTH_THICK } from '@/constants/border';
import { type ColorVariant } from '@/constants/theme';

import Box from '../Box';
import Icon, { type IconName } from '../Icon';
import Row from '../Row';
import Stack from '../Stack';
import Surface from '../Surface';
import Text from '../Text';

/**
 * The library centres the card in a full-width container, so nothing above it gives it a width:
 * without one a short toast is a pill and a sentence runs edge to edge. 340 is the library's own
 * BaseToast width, which it does not export. Not a token: it is the third-party frame.
 */
const TOAST_WIDTH = 340;

/** The library draws 5 pt; this is the widest generic rung, one point thinner. */
const ACCENT_RULE_WIDTH = BORDER_WIDTH_THICK;

interface ToastKindTreatment {
    /** One prop for rule and glyph: all four roles hold the same colour in both slots. */
    colorVariant: ColorVariant;
    iconName: IconName;
}

/**
 * Keys are the library's own `type` strings, which is the wire: it looks the renderer up by them
 * and throws on a type with no entry. Values are roles, not situations.
 */
const TOAST_KIND = {
    success: { colorVariant: 'positive', iconName: 'checkmark-outline' },
    error: { colorVariant: 'negative', iconName: 'ban-outline' },
    warning: { colorVariant: 'notice', iconName: 'warning-outline' },
    info: { colorVariant: 'informative', iconName: 'information-outline' },
} as const satisfies Record<string, ToastKindTreatment>;

export type ToastKind = keyof typeof TOAST_KIND;

export interface ToastCardProps {
    /** Which treatment to draw. Derived from the map, so a kind with no entry cannot compile. */
    kind: ToastKind;
    /** Required-but-nullable, so the renderer cannot forget a line the library may omit. */
    title: string | undefined;
    message: string | undefined;
}

/**
 * One toast: a card whose leading edge carries the kind's colour, with a glyph and two lines.
 *
 * Not the library's BaseToast, which hard-codes a white fill with black text and so ignores the
 * dark theme. No press target either: the library defaults `onPress` to a noop, so a renderer
 * cannot tell "no action" from "an action". Swipe-to-dismiss lives on the container, not here.
 */
export function ToastCard(props: ToastCardProps) {
    const {
        kind,
        title,
        message,
    } = props;

    const { colorVariant, iconName } = TOAST_KIND[kind];

    // A toast is out of the reading order, so a screen reader gets one node with both lines
    // rather than two stray labels it may never reach.
    const announcement = [title, message].filter(isTruthyString).join('. ');

    return (
        <Box
            accessible
            accessibilityRole="alert"
            accessibilityLabel={announcement}
        >
            <Surface
                colorVariant={colorVariant}
                styleVariant="elevated"
                radius="xs"
                width={TOAST_WIDTH}
                // So the inner card's square corners follow the outer radius, the way a
                // borderLeft does.
                withClipping
            >
                <Row spacing="none" align="stretch">
                    <Box width={ACCENT_RULE_WIDTH} />
                    <Surface
                        colorVariant="default"
                        paddingInline="xs"
                        paddingBlock="3xs"
                        flex="fill"
                    >
                        <Row spacing="3xs" align="start">
                            <Icon
                                name={iconName}
                                sizeVariant="xl"
                                colorVariant={colorVariant}
                            />
                            <Stack spacing="4xs" grow="fill">
                                {isTruthyString(title) && (
                                    // One line, matching the library's text1NumberOfLines
                                    // default; the message below it is free to wrap, which is
                                    // what text2NumberOfLines={0} was asking for.
                                    <Text variant="subtitle" numberOfLines={1}>
                                        {title}
                                    </Text>
                                )}
                                {isTruthyString(message) && (
                                    <Text variant="label" colorVariant="secondary">
                                        {message}
                                    </Text>
                                )}
                            </Stack>
                        </Row>
                    </Surface>
                </Row>
            </Surface>
        </Box>
    );
}

/**
 * The library calls a config entry rather than mounting it, so it must return an element of a
 * real component: hooks written here would belong to the library's render.
 */
function createToastRenderer(kind: ToastKind) {
    return function renderToast(params: ToastConfigParams<unknown>) {
        return (
            <ToastCard
                kind={kind}
                title={params.text1}
                message={params.text2}
            />
        );
    };
}

/**
 * The whole surface react-native-toast-message sees, derived from TOAST_KIND so the two cannot
 * drift. Object.keys widens to string[], hence the cast.
 *
 * Only this file and components/Toast.ts know the library exists; a `type` with no entry here
 * throws at show time.
 */
export const toastConfig: ToastConfig = Object.fromEntries(
    (Object.keys(TOAST_KIND) as ToastKind[]).map(
        (kind) => [kind, createToastRenderer(kind)],
    ),
);
