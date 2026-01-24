import { SPACING_2XS } from '@/constants/dimensions';
import useTheme from '@/hooks/useTheme';
import { Tabs } from 'expo-router';
import { MapPinIcon, UserIcon } from 'phosphor-react-native';

function HomeLayout() {
    const theme = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
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
                    tabBarActiveTintColor: theme.primaryDark,
                    tabBarIcon: ({ focused, color }) => (
                        <MapPinIcon
                            color={focused ? theme.primary : color}
                            weight={focused ? 'fill' : 'regular'}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarActiveTintColor: theme.primaryDark,
                    tabBarIcon: ({ focused, color }) => (
                        <UserIcon
                            color={focused ? theme.primary : color}
                            weight={focused ? 'fill' : 'regular'}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

export default HomeLayout;
