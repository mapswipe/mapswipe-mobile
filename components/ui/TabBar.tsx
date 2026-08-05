import { type ReactNode } from 'react';
import {
    View,
    type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Tabs } from 'expo-router';
// Two specifiers for one module, deliberately. The navigator comes from the package root, which is
// where every other layout in the app imports its navigator from and, more to the point, the path
// jest/setup.tsx stubs: a subpath import would resolve to a second, unmocked copy and a test that
// renders this would boot the real navigator with no container under it. The option types are only
// re-exported from the subpath, so they have nowhere else to come from.
import {
    type BottomTabBarButtonProps,
    type BottomTabNavigationOptions,
} from 'expo-router/js-tabs';

import Icon, { type IconName } from '@/components/ui/Icon';
import Pressable from '@/components/ui/Pressable';
import {
    BORDER_WIDTH_NONE,
    BORDER_WIDTH_THICK,
} from '@/constants/border';
import {
    OPACITY_FULL,
    OPACITY_HIDDEN,
    OPACITY_MUTED,
} from '@/constants/opacity';
import { TAB_BAR_HEIGHT } from '@/constants/size';
import {
    type AppTheme,
    resolveColor,
} from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { resolveBoxStyle } from '@/utils/layout';

/** 24, the conventional tab-bar icon size on both platforms. */
const TAB_ICON_SIZE = '2xl';

// The icon-and-label slot: it fills whatever the focus rule leaves and centres its content.
const CONTENT_LAYOUT = resolveBoxStyle({
    flex: 1,
    align: 'center',
    justify: 'center',
});

/**
 * Opacity rather than a second colour: the bar is navy in both themes and the theme has no
 * de-emphasised foreground to pair with it (`textMuted` drops to 3:1 on navy in the dark theme).
 */
const CONTENT_STYLE = {
    selected: { ...CONTENT_LAYOUT, opacity: OPACITY_FULL },
    unselected: { ...CONTENT_LAYOUT, opacity: OPACITY_MUTED },
} as const satisfies Record<string, ViewStyle>;

export type TabStateType = keyof typeof CONTENT_STYLE;

/** Laid out in both states, painted in one, so selecting a tab cannot shift its glyph. */
const INDICATOR_OPACITY = {
    selected: OPACITY_FULL,
    unselected: OPACITY_HIDDEN,
} as const satisfies Record<TabStateType, number>;

interface BarStyleOptions {
    /** Bottom safe-area inset, measured, so it crosses as a number. */
    insetBlockEnd: number;
}

/**
 * `height` includes the inset: getTabBarHeight returns a custom height verbatim and the bar then
 * pads its own bottom, so the content band stays TAB_BAR_HEIGHT tall above the gesture area.
 */
const createScreenOptions = (
    theme: AppTheme,
    options: BarStyleOptions,
): BottomTabNavigationOptions => {
    const { insetBlockEnd } = options;

    // One colour for both states: see CONTENT_STYLE. It reaches the label, which react-navigation
    // renders itself; the glyph takes the same role through ui/Icon.
    const tint = resolveColor(theme, 'onBrand', 'content');

    return {
        headerShown: false,
        tabBarStyle: {
            height: TAB_BAR_HEIGHT + insetBlockEnd,
            backgroundColor: resolveColor(theme, 'brand', 'surface'),
            borderTopWidth: BORDER_WIDTH_NONE,
        },
        tabBarActiveTintColor: tint,
        tabBarInactiveTintColor: tint,
    };
};

const createIndicatorStyle = (
    theme: AppTheme,
    options: { state: TabStateType },
): ViewStyle => ({
    height: BORDER_WIDTH_THICK,
    backgroundColor: resolveColor(theme, 'accent', 'surface'),
    opacity: INDICATOR_OPACITY[options.state],
});

/**
 * The navigator's handlers are zero-argument closures typed as PlatformPressable's, which
 * declares an event parameter. Narrowing the arity here beats fabricating an event to hand back.
 */
function toVoidHandler(handler: ((event: never) => void) | null | undefined): () => void {
    const call = handler as (() => void) | undefined;

    return () => {
        call?.();
    };
}

interface TabBarButtonProps {
    /** The glyph and the label, both rendered by react-navigation from the screen's options. */
    children: ReactNode;
    accessibilityLabel: string;
    state: TabStateType;
    onPress: () => void;
    onLongPress: () => void;
    testID: string | undefined;
}

/** One tab. It exists for the focus rule, which react-navigation's own button has not. */
function TabBarButton(props: TabBarButtonProps) {
    const {
        children,
        accessibilityLabel,
        state,
        onPress,
        onLongPress,
        testID,
    } = props;

    const indicatorStyle = useThemedStyles(createIndicatorStyle, { state });

    return (
        <Pressable
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="tab"
            // flexBasis 0, so the tabs take equal shares whatever their labels measure.
            grow
            onPress={onPress}
            onLongPress={onLongPress}
            testID={testID}
        >
            <View style={indicatorStyle} />
            {/*
              * A plain box rather than a Stack: the emphasis opacity is not a layout axis, and
              * widening every layout primitive with one to save a view here would be the wrong
              * trade.
              */}
            <View style={CONTENT_STYLE[state]}>
                {children}
            </View>
        </Pressable>
    );
}

/** Module-level factories: a function returning JSX inside a component is a nested component. */
function createTabBarButtonRenderer(label: string) {
    return function renderTabBarButton(props: BottomTabBarButtonProps) {
        const {
            children,
            onPress,
            onLongPress,
            testID,
            'aria-label': ariaLabel,
            'aria-selected': selected,
        } = props;

        return (
            <TabBarButton
                // On iOS the navigator composes "Projects, tab, 1 of 2"; elsewhere it passes
                // nothing at all, and ui/Pressable requires a label, so the tab's own is the
                // fallback. Today every tab announces itself as a bare "button".
                accessibilityLabel={ariaLabel ?? label}
                // The navigator's own flag. The layout derives this from usePathname instead,
                // which is both a second source of truth and wrong for a nested route.
                state={selected ? 'selected' : 'unselected'}
                onPress={toVoidHandler(onPress)}
                onLongPress={toVoidHandler(onLongPress)}
                testID={testID}
            >
                {children}
            </TabBarButton>
        );
    };
}

/**
 * Called with both states: react-navigation draws the glyph twice and cross-fades, so the weight
 * change animates. Its `color` and `size` are ignored in favour of a role and a rung.
 */
function createTabIconRenderer(name: IconName) {
    return function renderTabIcon(props: { focused: boolean }) {
        return (
            <Icon
                name={name}
                sizeVariant={TAB_ICON_SIZE}
                colorVariant="onBrand"
                emphasis={props.focused ? 'filled' : 'regular'}
            />
        );
    };
}

export interface TabBarItem {
    /** The route file under this layout, and the React key, so it must be unique. */
    name: string;
    /** Shown under the glyph and announced by the screen reader. Translated by the caller. */
    label: string;
    icon: IconName;
}

export interface TabBarProps {
    /** In bar order. */
    tabs: TabBarItem[];
}

/**
 * The bottom tab chrome: the navigator, the bar it paints, and the button each tab gets.
 *
 * A component rather than a hook returning screenOptions, so neither the ViewStyle nor the
 * per-screen glyph crosses back to the layout. Unlisted screens still get a tab, since
 * expo-router routes from the filesystem; listing one is how it gets a label and a glyph.
 */
function TabBar(props: TabBarProps) {
    const { tabs } = props;

    const insets = useSafeAreaInsets();
    const screenOptions = useThemedStyles(createScreenOptions, { insetBlockEnd: insets.bottom });

    return (
        <Tabs screenOptions={screenOptions}>
            {tabs.map((tab) => (
                <Tabs.Screen
                    key={tab.name}
                    name={tab.name}
                    options={{
                        // What react-navigation renders as the label under the glyph.
                        title: tab.label,
                        tabBarIcon: createTabIconRenderer(tab.icon),
                        tabBarButton: createTabBarButtonRenderer(tab.label),
                    }}
                />
            ))}
        </Tabs>
    );
}

export default TabBar;
