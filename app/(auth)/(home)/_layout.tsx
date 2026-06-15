import {
    GestureResponderEvent,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    Tabs,
    usePathname,
} from 'expo-router';
import {
    MapPinIcon,
    UserIcon,
} from 'phosphor-react-native';

import useTheme from '@/hooks/useTheme';

interface TabBarButtonProps {
    href?: string;
    children: React.ReactNode;
    onPress?: (
        e: GestureResponderEvent
    ) => void;
}

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

function TabBarButton({ children, onPress, href }: TabBarButtonProps) {
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
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.primaryBlue,
                    borderTopColor: 'transparent',
                    height: 60 + insets.bottom, // add safe area inset
                },

                tabBarActiveTintColor: '#ffffff',
                tabBarInactiveTintColor: '#9CA3AF',
                // eslint-disable-next-line react/no-unstable-nested-components
                tabBarButton: (props: TabBarButtonProps) => (
                    <TabBarButton
                        href={props.href}
                        onPress={props.onPress}
                    >
                        {props.children}
                    </TabBarButton>
                ),
            }}
        >
            <Tabs.Screen
                name="projects"
                options={{
                    title: 'Projects',
                    // eslint-disable-next-line react/no-unstable-nested-components
                    tabBarIcon: ({ focused, color }) => (
                        <MapPinIcon
                            color={focused ? theme.textOnBrand : String(color)}
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
                            color={focused ? theme.textOnBrand : String(color)}
                            weight={focused ? 'fill' : 'regular'}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

export default HomeLayout;
