import React, {
    useRef,
    useState,
} from 'react';
import {
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import welcome1 from '@/assets/images/custom/welcome1.png';
import welcome2 from '@/assets/images/custom/welcome2.png';
import welcome3 from '@/assets/images/custom/welcome3.png';
import welcome4 from '@/assets/images/custom/welcome4.png';
import welcome5 from '@/assets/images/custom/welcome5.png';
import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Text from '@/components/Text';
import {
    FONT_SIZE_3XL,
    FONT_SIZE_XL,
    SCREEN_HEIGHT,
    SCREEN_WIDTH,
} from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';

const { width, height } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Welcome to MapSwipe',
        description: 'Help improve humanitarian responses from the comfort of your phone',
        imageUrl: welcome1,
    },
    {
        id: '2',
        title: 'Part of Missing Maps',
        description: 'With Missing Maps, we aim to put the world\'s vulnerable communities on the map',
        imageUrl: welcome2,
    },
    {
        id: '3',
        title: 'Swipe',
        description: 'Complete tasks by swiping through satellite imagery of areas that need mapping',
        imageUrl: welcome3,
    },
    {
        id: '4',
        title: 'Create meaningful data',
        description: 'The data is used to focus the efforts of Missing Maps volunteers to add detail to OpenStreetMap',
        imageUrl: welcome4,
    },
    {
        id: '5',
        title: 'Save lives',
        description: 'The map helps organisations coordinate humanitarian efforts and save lives',
        imageUrl: welcome5,
    },
];

const createStyles = (theme: AppTheme) => StyleSheet.create({
    mainContent: {
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        resizeMode: 'contain',
        height: SCREEN_HEIGHT * 0.3,
        width: SCREEN_WIDTH * 0.8,
    },
    heading: {
        color: theme.primaryBlue,
        textAlign: 'center',
        fontSize: FONT_SIZE_3XL,
        fontWeight: 'bold',
        width: SCREEN_WIDTH * 0.75,
    },
    text: {
        color: theme.primaryBlue,
        width: SCREEN_WIDTH * 0.8,
        textAlign: 'center',
        fontSize: FONT_SIZE_XL,
    },
    dotContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 40,
        width: '100%',
    },
    dotBase: {
        height: 8,
        width: 8,
        borderRadius: 4,
        marginHorizontal: 6,
    },

});
export default function Onboarding() {
    const [index, setIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const styles = useThemedStyles(createStyles);
    const theme = useTheme();
    const router = useRouter();

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideIndex = Math.round(
            event.nativeEvent.contentOffset.x / width,
        );
        setIndex(slideIndex);
    };

    const handleSignUp = async () => {
        try {
            await AsyncStorage.setItem('@hasSeenOnboarding', 'true');
            router.replace('/register'); // Navigate to Sign Up screen
        } catch (error) {
            console.error('Error saving onboarding state:', error);
        }
    };

    return (
        <View>
            <FlatList
                ref={flatListRef}
                data={slides}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index: itemIndex }) => (
                    <BlockListView
                        style={styles.mainContent}
                        withCenteredContent
                        withPadding
                    >
                        <Image
                            style={styles.icon}
                            source={item.imageUrl}
                        />
                        <BlockListView withCenteredContent withPadding>
                            <Text style={styles.heading}>
                                {item.title}
                            </Text>
                            <Text style={styles.text}>
                                {item.description}
                            </Text>
                        </BlockListView>

                        {/* Only render button on the last slide */}
                        {itemIndex === slides.length - 1 && (
                            <Button
                                name="Sign Up"
                                title="Sign Up"
                                colorVariant="primaryRed"
                                styleVariant="filled"
                                onPress={handleSignUp}
                            />
                        )}
                    </BlockListView>
                )}
            />
            <View style={styles.dotContainer}>
                {slides.map((item, i) => (
                    <View
                        key={item.id}
                        style={[
                            styles.dotBase,
                            // eslint-disable-next-line react-native/no-inline-styles
                            { backgroundColor: i === index ? theme.backgroundBrand : '#ccc' },
                        ]}
                    />
                ))}
            </View>
        </View>
    );
}
