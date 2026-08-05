import {
    type ReactNode,
    useCallback,
    useLayoutEffect,
    useState,
} from 'react';
import {
    KeyboardAvoidingView,
    type KeyboardAvoidingViewProps,
    Modal as NativeModal,
    Platform,
    ScrollView,
    type ViewStyle,
} from 'react-native';
import {
    type Edge,
    SafeAreaView,
} from 'react-native-safe-area-context';
import {
    useFocusEffect,
    useNavigation,
} from 'expo-router';
import {
    setStatusBarStyle,
    type StatusBarStyle,
} from 'expo-status-bar';

import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
import Positioned from '@/components/ui/Positioned';
import Pressable from '@/components/ui/Pressable';
import Scrim from '@/components/ui/Scrim';
import Spinner from '@/components/ui/Spinner';
import Stack, { type GrowType } from '@/components/ui/Stack';
import Surface from '@/components/ui/Surface';
import Text from '@/components/ui/Text';
import { HEADER_ACTION_RESERVE } from '@/constants/size';
import {
    type AppTheme,
    type ColorVariant,
    type ThemeColorKey,
} from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import useViewport from '@/hooks/useViewport';
import { type SpacingType } from '@/utils/styles';

/**
 * Not a `ColorVariant`: no COLOR_ROLE `surface` slot reaches `background`, so a ColorVariant here
 * would silently repaint every ordinary screen. The fill still travels with a legible foreground.
 */
const SCREEN_SURFACE = {
    default: { fill: 'background', content: 'default' },
    brand: { fill: 'backgroundBrand', content: 'onBrand' },
} as const satisfies Record<string, { fill: ThemeColorKey; content: ColorVariant }>;

export type ScreenColorVariant = keyof typeof SCREEN_SURFACE;

interface ScreenLayout {
    /** The body scrolls, and its content container grows so a short page still fills the window. */
    withScroll: boolean;
    /** How the content claims the body's block axis. */
    grow: GrowType | undefined;
}

/**
 * `fill` is the pane the children divide up themselves. It grows as a bounded `slot`: a pane that
 * refuses to shrink below its content is how a map pushes the buttons under it off screen.
 */
const SCREEN_LAYOUT = {
    scroll: { withScroll: true, grow: undefined },
    fill: { withScroll: false, grow: 'slot' },
} as const satisfies Record<string, ScreenLayout>;

export type ScreenLayoutType = keyof typeof SCREEN_LAYOUT;

/** `bottom` is what a screen with a navigator header wants: the header covers the status bar. */
const SAFE_AREA_EDGES = {
    top: ['top'],
    bottom: ['bottom'],
    both: ['top', 'bottom'],
    none: [],
} as const satisfies Record<string, readonly Edge[]>;

export type ScreenSafeAreaType = keyof typeof SAFE_AREA_EDGES;

/** Logical, not physical: react-navigation's `left` already follows the writing direction. */
const HEADER_TITLE_ALIGN = {
    start: 'left',
    center: 'center',
} as const satisfies Record<string, 'left' | 'center'>;

export type ScreenTitleAlignType = keyof typeof HEADER_TITLE_ALIGN;

// Android resizes the window itself, so a behaviour there would apply the inset twice.
const KEYBOARD_BEHAVIOR: KeyboardAvoidingViewProps['behavior'] = Platform.OS === 'ios'
    ? 'padding'
    : undefined;

/** `empty={flag && <X />}` is `false` when the flag is off, which is not a filled slot. */
function isFilledSlot(slot: ReactNode): boolean {
    return slot !== undefined && slot !== null && typeof slot !== 'boolean';
}

interface ScreenStyleOptions {
    colorVariant: ScreenColorVariant;
}

interface ScreenStyles {
    root: ViewStyle;
    keyboardAvoider: ViewStyle;
    scrollContent: ViewStyle;
    header: ViewStyle;
}

// Plain objects, not a StyleSheet: these are theme-dependent or handed to react-navigation.
const createStyles = (theme: AppTheme, options: ScreenStyleOptions): ScreenStyles => ({
    root: {
        flex: 1,
        backgroundColor: theme[SCREEN_SURFACE[options.colorVariant].fill],
    },
    keyboardAvoider: {
        flex: 1,
    },
    // Without it a short page pins its content to the top, so a centred empty state rides high.
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        backgroundColor: theme.backgroundBrand,
    },
});

interface TitleWithPopupProps {
    title: string;
    /** Measured: the window width less the space the header buttons reserve on both sides. */
    maxWidth: number;
}

/**
 * Bounded so it ellipsizes rather than sliding under the header buttons, with the full string a
 * long press away. Truncation is the normal case: a project's instruction is the mapping title.
 *
 * TODO: use ui/Modal for the popup once that exists.
 */
function TitleWithPopup(props: TitleWithPopupProps) {
    const {
        title,
        maxWidth,
    } = props;

    const [visible, setVisible] = useState(false);

    const handleOpen = useCallback(() => { setVisible(true); }, []);
    const handleClose = useCallback(() => { setVisible(false); }, []);

    return (
        <Box maxWidth={maxWidth}>
            <Pressable
                accessibilityLabel={title}
                // The title is a label that happens to be long-pressable, not a control, so it
                // must not dim under the finger.
                feedback="none"
                onLongPress={handleOpen}
            >
                <Text
                    colorVariant="onBrand"
                    numberOfLines={1}
                >
                    {title}
                </Text>
            </Pressable>
            <NativeModal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={handleClose}
            >
                {/* One target over the whole backdrop, labelled with the title it exists to
                    show: there is no invented "close" copy to translate, and the popup holds
                    nothing else to press. */}
                <Pressable
                    accessibilityLabel={title}
                    feedback="none"
                    withoutHitSlop
                    grow
                    onPress={handleClose}
                >
                    <Stack
                        spacing="none"
                        grow="fill"
                        align="center"
                        justify="center"
                        padding="lg"
                    >
                        <Scrim colorVariant="modal" />
                        <Surface
                            radius="lg"
                            padding="md"
                        >
                            <Text variant="title">
                                {title}
                            </Text>
                        </Surface>
                    </Stack>
                </Pressable>
            </NativeModal>
        </Box>
    );
}

interface CommonProps {
    /** Drawn in the navigator header, and long-pressable there. See TitleWithPopup. */
    title: string;

    /** Optional: a screen whose whole job is a state has no content of its own. */
    children?: ReactNode;

    /** Defaults to `default`, i.e. `background`. */
    colorVariant?: ScreenColorVariant;

    /** Defaults to `scroll`. */
    layout?: ScreenLayoutType;

    /**
     * Defaults to `top`. A screen with `withHeader` almost always wants `bottom`, or insetting
     * the top again leaves a navy band under the header.
     */
    safeArea?: ScreenSafeAreaType;

    /** Inset around the content, the footer and any state slot. The hero stays full bleed. */
    padding?: SpacingType;

    /** Defaults to `none`. */
    spacing?: SpacingType;

    /** Takes precedence over `error` and `empty`. */
    pending?: boolean;

    /** Without it the wait is silent: an unlabelled spinner stays out of the accessibility tree. */
    pendingLabel?: string;

    /** A node, not a message, because the retry affordance belongs with the copy. */
    error?: ReactNode;

    /** Ranks below `error`. */
    empty?: ReactNode;

    /** Escapes `padding` on purpose: that is what makes it a hero rather than a first child. */
    hero?: ReactNode;

    /** Pinned below the body, outside the scroll. Survives `pending`, `error` and `empty`. */
    footer?: ReactNode;

    /** Overlay at the `chrome` rung, transparent to touches it does not claim. */
    chrome?: ReactNode;

    /** Lifts the body clear of the keyboard. Off by default. */
    withKeyboardAvoidance?: boolean;

    testID?: string;
}

/** Header-only props travel with the header, so none can be set without one. */
type ScreenHeaderProps = {
    withHeader?: false;
    backAccessibilityLabel?: never;
    onBackPress?: never;
    headerTitleAlign?: never;
    headerActions?: never;
} | {
    withHeader: true;

    /** Required: the back button is a bare glyph with nothing else to be announced as. */
    backAccessibilityLabel: string;

    /** Intercepts the back tap, e.g. to confirm before abandoning a session. Must be memoized. */
    onBackPress?: () => void;

    /** Defaults to `start`. */
    headerTitleAlign?: ScreenTitleAlignType;

    /** Must be memoized. */
    headerActions?: () => ReactNode;
};

export type ScreenProps = CommonProps & ScreenHeaderProps;

/** The screen template: chrome, safe area, and the pending, error and empty states. */
function Screen(props: ScreenProps) {
    const {
        title,
        children,
        colorVariant = 'default',
        layout = 'scroll',
        safeArea = 'top',
        padding,
        spacing = 'none',
        pending = false,
        pendingLabel,
        error,
        empty,
        hero,
        footer,
        chrome,
        withKeyboardAvoidance = false,
        testID,
        withHeader = false,
        backAccessibilityLabel,
        onBackPress,
        headerTitleAlign = 'start',
        headerActions,
    } = props;

    const navigation = useNavigation();
    const theme = useTheme();
    const styles = useThemedStyles(createStyles, { colorVariant });
    const viewport = useViewport();

    const contentColorVariant = SCREEN_SURFACE[colorVariant].content;

    const titleMaxWidth = Math.max(0, viewport.width - HEADER_ACTION_RESERVE);

    // The union makes this a string whenever a header exists; the destructured local cannot
    // carry that narrowing, so the fallback is unreachable rather than a default.
    const backLabel = backAccessibilityLabel ?? title;

    const handleBackPress = useCallback(
        () => {
            if (onBackPress !== undefined) {
                onBackPress();
                return;
            }

            navigation.goBack();
        },
        [navigation, onBackPress],
    );

    const headerLeft = useCallback(
        () => (
            <IconButton
                name="back"
                iconName="arrow-left"
                accessibilityLabel={backLabel}
                colorVariant="onBrand"
                onPress={handleBackPress}
            />
        ),
        [backLabel, handleBackPress],
    );

    const headerTitle = useCallback(
        () => (
            <TitleWithPopup
                title={title}
                maxWidth={titleMaxWidth}
            />
        ),
        [title, titleMaxWidth],
    );

    useLayoutEffect(
        () => {
            // Outside a navigator (the root layout's loading screen) useNavigation returns a
            // placeholder whose setOptions throws. Nothing to configure there.
            try {
                navigation.setOptions({
                    headerShown: withHeader,
                    headerBackVisible: false,
                    headerStyle: styles.header,
                    headerTintColor: theme.textOnBrand,
                    headerShadowVisible: false,
                    headerTitleAlign: HEADER_TITLE_ALIGN[headerTitleAlign],
                    headerTitle,
                    headerRight: headerActions,
                    headerLeft,
                });
            } catch {
                // not inside a navigator screen, so there is no header to configure
            }
        },
        [
            navigation,
            styles,
            theme,
            withHeader,
            headerTitleAlign,
            headerTitle,
            headerActions,
            headerLeft,
        ],
    );

    // A brand page and a navigator header are both navy, so either way the bar needs light content.
    const statusBarStyle: StatusBarStyle = colorVariant === 'brand' || withHeader
        ? 'light'
        : 'dark';

    /*
     * Deliberately no <StatusBar> element as well as this: RN's StatusBar applies the instance
     * mounted last, not the focused one, and both tabs stay mounted. The pair raced, which is
     * what put light glyphs on the pale projects list.
     */
    useFocusEffect(
        useCallback(() => {
            setStatusBarStyle(statusBarStyle);
        }, [statusBarStyle]),
    );

    let stateContent: ReactNode;

    if (pending) {
        stateContent = (
            <>
                <Spinner colorVariant={contentColorVariant} />
                {pendingLabel !== undefined && (
                    <Text
                        colorVariant={contentColorVariant}
                        align="center"
                    >
                        {pendingLabel}
                    </Text>
                )}
            </>
        );
    } else if (isFilledSlot(error)) {
        stateContent = error;
    } else if (isFilledSlot(empty)) {
        stateContent = empty;
    }

    let body: ReactNode;

    if (stateContent !== undefined) {
        // A state is never scrollable: it is one short block, and it wants the middle of the
        // viewport rather than the top of a scroll region.
        body = (
            <Stack
                spacing="sm"
                padding={padding}
                grow="slot"
                align="center"
                justify="center"
            >
                {stateContent}
            </Stack>
        );
    } else {
        const content = (
            <>
                {hero}
                <Stack
                    spacing={spacing}
                    padding={padding}
                    grow={SCREEN_LAYOUT[layout].grow}
                >
                    {children}
                </Stack>
            </>
        );

        body = SCREEN_LAYOUT[layout].withScroll
            ? (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {content}
                </ScrollView>
            )
            : content;
    }

    const pane = (
        <>
            {body}
            {isFilledSlot(footer) && (
                <Stack
                    spacing={spacing}
                    padding={padding}
                >
                    {footer}
                </Stack>
            )}
        </>
    );

    return (
        <SafeAreaView
            style={styles.root}
            edges={SAFE_AREA_EDGES[safeArea]}
            testID={testID}
        >
            {withKeyboardAvoidance ? (
                <KeyboardAvoidingView
                    style={styles.keyboardAvoider}
                    behavior={KEYBOARD_BEHAVIOR}
                >
                    {pane}
                </KeyboardAvoidingView>
            ) : pane}
            {isFilledSlot(chrome) && (
                <Positioned
                    anchor="fill"
                    layer="chrome"
                    // An overlay that eats the touches meant for the map under it is a bug.
                    pointerEvents="box-none"
                >
                    {chrome}
                </Positioned>
            )}
        </SafeAreaView>
    );
}

export default Screen;
