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
    useSafeAreaInsets,
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
import Divider, { type DividerColorVariant } from '@/components/ui/Divider';
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
    resolveColor,
    type ThemeColorKey,
} from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import useViewport from '@/hooks/useViewport';
import {
    type AlignType,
    type JustifyType,
} from '@/utils/layout';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

// Not a `ColorVariant`: no COLOR_ROLE `surface` slot reaches `background`. `header` is the same
// surface as the page, so a header never lands a navy bar on a light screen.
const SCREEN_SURFACE = {
    default: {
        fill: 'background',
        content: 'default',
        header: 'background',
        // Risen off the page, so the actions read as their own band.
        footer: 'surface',
        rule: 'default',
        statusBar: 'dark',
    },
    brand: {
        fill: 'backgroundBrand',
        content: 'onBrand',
        header: 'backgroundBrand',
        footer: 'onBrand',
        rule: 'onBrand',
        statusBar: 'light',
    },
} as const satisfies Record<string, {
    fill: ThemeColorKey;
    content: ColorVariant;
    header: ThemeColorKey;
    footer: ColorVariant;
    rule: DividerColorVariant;
    statusBar: StatusBarStyle;
}>;

export type ScreenColorVariant = keyof typeof SCREEN_SURFACE;

interface ScreenLayout {
    withScroll: boolean;
    grow: GrowType | undefined;
    align: AlignType | undefined;
    justify: JustifyType | undefined;
}

const SCREEN_LAYOUT = {
    scroll: {
        withScroll: true, grow: undefined, align: undefined, justify: undefined,
    },
    fill: {
        withScroll: false, grow: 'slot', align: undefined, justify: undefined,
    },
    // A screen whose body is one block: a message, a result, an outcome.
    centered: {
        withScroll: false, grow: 'slot', align: 'center', justify: 'center',
    },
} as const satisfies Record<string, ScreenLayout>;

export type ScreenLayoutType = keyof typeof SCREEN_LAYOUT;

const SAFE_AREA_EDGES = {
    top: ['top'],
    bottom: ['bottom'],
    both: ['top', 'bottom'],
    none: [],
} as const satisfies Record<string, readonly Edge[]>;

export type ScreenSafeAreaType = keyof typeof SAFE_AREA_EDGES;

// Logical, not physical: react-navigation's `left` follows the writing direction.
const HEADER_TITLE_ALIGN = {
    start: 'left',
    center: 'center',
} as const satisfies Record<string, 'left' | 'center'>;

export type ScreenTitleAlignType = keyof typeof HEADER_TITLE_ALIGN;

// Android resizes the window itself, so a behaviour there would apply the inset twice.
const KEYBOARD_BEHAVIOR: KeyboardAvoidingViewProps['behavior'] = Platform.OS === 'ios'
    ? 'padding'
    : undefined;

// What the band insets by when the body is unpadded and there is nothing to line up with.
const FOOTER_FALLBACK_INSET: SpacingType = 'md';
const FOOTER_SPACING: SpacingType = 'md';

function renderNothing(): null {
    return null;
}

// `flag && <X />` is `false` when the flag is off, which is not a filled slot.
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

// Plain objects, not a StyleSheet: some of these are handed to react-navigation.
const createStyles = (theme: AppTheme, options: ScreenStyleOptions): ScreenStyles => ({
    root: {
        flex: 1,
        backgroundColor: theme[SCREEN_SURFACE[options.colorVariant].fill],
    },
    keyboardAvoider: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        backgroundColor: theme[SCREEN_SURFACE[options.colorVariant].header],
    },
});

interface TitleWithPopupProps {
    style?: never;
    title: string;
    maxWidth: number;
    colorVariant: ColorVariant;
}

// TODO: use ui/Modal once it can dismiss on backdrop press, this popup's only affordance.
function TitleWithPopup(props: TitleWithPopupProps) {
    const {
        title,
        maxWidth,
        colorVariant,
    } = props;

    const [visible, setVisible] = useState(false);

    const handleOpen = useCallback(() => { setVisible(true); }, []);
    const handleClose = useCallback(() => { setVisible(false); }, []);

    return (
        <Box maxWidth={maxWidth}>
            <Pressable
                accessibilityLabel={title}
                // A long-pressable label, not a control, so it must not dim under the finger.
                feedback="none"
                onLongPress={handleOpen}
            >
                <Text
                    colorVariant={colorVariant}
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
    style?: never;
    title: string;

    children?: ReactNode;

    colorVariant?: ScreenColorVariant;

    layout?: ScreenLayoutType;

    /** With `withHeader`, prefer `bottom`: insetting the top again leaves a band under it. */
    safeArea?: ScreenSafeAreaType;

    padding?: SpacingType;

    spacing?: SpacingType;

    /** Takes precedence over `error` and `empty`. */
    pending?: boolean;

    pendingLabel?: string;

    error?: ReactNode;

    /** Ranks below `error`. */
    empty?: ReactNode;

    /** Escapes `padding` on purpose, so it stays full bleed. */
    hero?: ReactNode;

    /**
     * Outside the scroll, and survives `pending`, `error` and `empty`. Insets and gaps itself,
     * so a screen never picks those.
     */
    footer?: ReactNode;

    controls?: ReactNode;

    withKeyboardAvoidance?: boolean;

    testID?: string;
}

type ScreenHeaderProps = {
    style?: never;
    withHeader?: false;
    backAccessibilityLabel?: never;
    onBackPress?: never;
    headerTitleAlign?: never;
    headerActions?: never;
    withoutHeaderTitle?: never;
} | {
    withHeader: true;

    /** Its presence draws the back button. A screen with nowhere to go back to leaves it out. */
    backAccessibilityLabel?: string;

    /** Intercepts the back tap. Must be memoized. */
    onBackPress?: () => void;

    headerTitleAlign?: ScreenTitleAlignType;

    /** Must be memoized. */
    headerActions?: () => ReactNode;

    /**
     * Keeps the bar and its actions but draws no title. `title` is still required and still
     * announced, so the screen keeps its name for a screen reader.
     */
    withoutHeaderTitle?: boolean;
};

export type ScreenProps = CommonProps & ScreenHeaderProps;

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
        controls,
        withKeyboardAvoidance = false,
        testID,
        withHeader = false,
        backAccessibilityLabel,
        onBackPress,
        headerTitleAlign = 'start',
        headerActions,
        withoutHeaderTitle = false,
    } = props;

    const navigation = useNavigation();
    const theme = useTheme();
    const styles = useThemedStyles(createStyles, { colorVariant });
    const viewport = useViewport();
    const insets = useSafeAreaInsets();

    const contentColorVariant = SCREEN_SURFACE[colorVariant].content;

    const titleMaxWidth = Math.max(0, viewport.width - HEADER_ACTION_RESERVE);

    // The union guarantees a string whenever a header exists, so the fallback is unreachable.

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
                accessibilityLabel={backAccessibilityLabel ?? ''}
                colorVariant={SCREEN_SURFACE[colorVariant].content}
                sizeVariant="header"
                onPress={handleBackPress}
            />
        ),
        [backAccessibilityLabel, handleBackPress, colorVariant],
    );

    const headerTitle = useCallback(
        () => (
            <TitleWithPopup
                title={title}
                maxWidth={titleMaxWidth}
                colorVariant={SCREEN_SURFACE[colorVariant].content}
            />
        ),
        [title, titleMaxWidth, colorVariant],
    );

    useLayoutEffect(
        () => {
            // Outside a navigator, useNavigation returns a placeholder whose setOptions throws.
            try {
                navigation.setOptions({
                    headerShown: withHeader,
                    headerBackVisible: false,
                    headerStyle: styles.header,
                    headerTintColor: resolveColor(theme, SCREEN_SURFACE[colorVariant].content),
                    headerShadowVisible: false,
                    headerTitleAlign: HEADER_TITLE_ALIGN[headerTitleAlign],
                    headerTitle: withoutHeaderTitle ? renderNothing : headerTitle,
                    headerRight: headerActions,
                    headerLeft: backAccessibilityLabel === undefined ? undefined : headerLeft,
                });
            } catch {
                // no header to configure
            }
        },
        [
            navigation,
            styles,
            theme,
            withHeader,
            headerTitleAlign,
            headerTitle,
            withoutHeaderTitle,
            headerActions,
            headerLeft,
            colorVariant,
            backAccessibilityLabel,
        ],
    );

    const statusBarStyle = SCREEN_SURFACE[colorVariant].statusBar;

    // No <StatusBar> element too: RN applies the last-mounted instance, not the focused one.
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
                    align={SCREEN_LAYOUT[layout].align}
                    justify={SCREEN_LAYOUT[layout].justify}
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

    // Matched to the body so the band's contents line up with the content above it.
    const footerInset = getSpacingValue(padding ?? FOOTER_FALLBACK_INSET);

    const pane = (
        <>
            {body}
            {isFilledSlot(footer) && (
                <Divider
                    colorVariant={SCREEN_SURFACE[colorVariant].rule}
                    spacing="none"
                />
            )}
            {isFilledSlot(footer) && (
                <Surface
                    colorVariant={SCREEN_SURFACE[colorVariant].footer}
                    padding="none"
                >
                    {/* The band reaches the window edge so its fill does, and pads its content
                        past the system bar instead of letting the pane inset the whole thing. */}
                    <Box
                        paddingInline={footerInset}
                        paddingBlockStart={footerInset}
                        paddingBlockEnd={footerInset + insets.bottom}
                    >
                        <Stack spacing={FOOTER_SPACING}>
                            {footer}
                        </Stack>
                    </Box>
                </Surface>
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
            {isFilledSlot(controls) && (
                <Positioned
                    anchor="fill"
                    layer="controls"
                    // box-none, or the overlay eats touches meant for the map under it.
                    pointerEvents="box-none"
                >
                    {controls}
                </Positioned>
            )}
        </SafeAreaView>
    );
}

export default Screen;
