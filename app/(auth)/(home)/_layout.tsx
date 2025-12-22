import { Tabs } from 'expo-router';
import { MapPinIcon, UserIcon } from 'phosphor-react-native';

function HomeLayout() {
    return (
        <Tabs
            screenOptions={{
                headerTitleStyle: {
                    paddingInlineStart: 10,
                },
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
                    tabBarIcon: ({ focused, color }) => (
                        <MapPinIcon
                            color={color}
                            weight={focused ? 'fill' : 'regular'}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ focused, color }) => (
                        <UserIcon
                            color={color}
                            weight={focused ? 'fill' : 'regular'}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}

export default HomeLayout;
