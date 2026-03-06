import {
    GestureResponderEvent,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import {
    Tabs,
    usePathname,
} from 'expo-router';
import type { PlatformPressable } from '@react-navigation/elements';
import {
    MapPinIcon,
    UserIcon,
} from 'phosphor-react-native';

import useTheme from '@/hooks/useTheme';

export type BottomTabBarButtonProps = Omit<
    React.ComponentProps<typeof PlatformPressable>,
    'style'
> & {
    href?: string;
    children: React.ReactNode;
    onPress?: (
        e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent
    ) => void;
};

const styles = StyleSheet.create({
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopWidth: 4,
        borderTopColor: 'transparent',
    },
    tabButtonActive: {
        borderTopColor: 'red', // your accent color
    },
});

function TabBarButton({ children, onPress, href }: BottomTabBarButtonProps) {
    const pathname = usePathname();
    const focused = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.tabButton, focused && styles.tabButtonActive]}
        >
            {children}
        </TouchableOpacity>
    );
}

function HomeLayout() {
    const theme = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.primaryBlue,
                    borderTopColor: 'transparent',
                    height: 60,
                },

                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#9CA3AF',
                // eslint-disable-next-line max-len
                // eslint-disable-next-line react/jsx-props-no-spreading, react/no-unstable-nested-components
                tabBarButton: (props) => <TabBarButton {...props} />,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{ href: null }}
            />
            <Tabs.Screen
                name="projects"
                options={{
                    title: 'Projects',
                    // eslint-disable-next-line react/no-unstable-nested-components
                    tabBarIcon: ({ focused, color }) => (
                        <MapPinIcon
                            color={focused ? theme.textOnBrand : color}
                            weight={focused ? 'fill' : 'regular'}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    // eslint-disable-next-line react/no-unstable-nested-components
                    tabBarIcon: ({ focused, color }) => (
                        <UserIcon
                            color={focused ? theme.textOnBrand : color}
                            weight={focused ? 'fill' : 'regular'}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

export default HomeLayout;
