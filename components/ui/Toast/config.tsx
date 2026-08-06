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

// Nothing above the card gives it a width; 340 is the library's own unexported BaseToast width.
const TOAST_WIDTH = 340;

const ACCENT_RULE_WIDTH = BORDER_WIDTH_THICK;

interface ToastKindTreatment {
    colorVariant: ColorVariant;
    iconName: IconName;
}

// Keys are the library's own `type` strings: it looks renderers up by them.
const TOAST_KIND = {
    success: { colorVariant: 'positive', iconName: 'checkmark-outline' },
    error: { colorVariant: 'negative', iconName: 'ban-outline' },
    warning: { colorVariant: 'notice', iconName: 'warning-outline' },
    info: { colorVariant: 'informative', iconName: 'information-outline' },
} as const satisfies Record<string, ToastKindTreatment>;

export type ToastKind = keyof typeof TOAST_KIND;

export interface ToastCardProps {
    style?: never;
    kind: ToastKind;
    title: string | undefined;
    message: string | undefined;
}

export function ToastCard(props: ToastCardProps) {
    const {
        kind,
        title,
        message,
    } = props;

    const { colorVariant, iconName } = TOAST_KIND[kind];

    // A toast is out of the reading order, so announce both lines as one node.
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
                // Clip so the inner card's square corners follow the outer radius.
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

// The library calls the entry rather than mounting it, so no hooks belong here.
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

// Derived from TOAST_KIND: a `type` with no entry here throws at show time.
export const toastConfig: ToastConfig = Object.fromEntries(
    (Object.keys(TOAST_KIND) as ToastKind[]).map(
        (kind) => [kind, createToastRenderer(kind)],
    ),
);
