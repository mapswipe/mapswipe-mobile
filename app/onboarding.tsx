import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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
import InlineListView from '@/components/InlineListView';
import Page from '@/components/Page';
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

const slides = [
    {
        id: '1',
        title: 'welcomeScreen:welcomeToMapSwipe',
        description: 'welcomeScreen:helpImprove',
        imageUrl: welcome1,
    },
    {
        id: '2',
        title: 'welcomeScreen:partMissingMaps',
        description: 'welcomeScreen:withMissingMaps',
        imageUrl: welcome2,
    },
    {
        id: '3',
        title: 'welcomeScreen:swipe',
        description: 'welcomeScreen:completeTasks',
        imageUrl: welcome3,
    },
    {
        id: '4',
        title: 'welcomeScreen:createData',
        description: 'welcomeScreen:dataUse',
        imageUrl: welcome4,
    },
    {
        id: '5',
        title: 'welcomeScreen:saveLives',
        description: 'welcomeScreen:mapHelps',
        imageUrl: welcome5,
    },
];

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        height: '100%',
    },
    mainContent: {
        width: SCREEN_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
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
    skip: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 100,
        zIndex: 1,
    },

});
export default function Onboarding() {
    const [index, setIndex] = useState(0);
    const styles = useThemedStyles(createStyles);
    const theme = useTheme();
    const router = useRouter();
    const { t } = useTranslation(['welcomeScreen', 'signup']);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const slideIndex = Math.round(
            event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
        );
        setIndex(slideIndex);
    };

    const handleSignUp = async () => {
        try {
            await AsyncStorage.setItem('@hasSeenOnboarding', 'true');
            router.replace('/register');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error saving onboarding state:', error);
        }
    };

    return (
        <Page
            title="onboarding"
            isScrollable={false}
        >
            <BlockListView style={styles.container}>
                <InlineListView style={styles.skip}>
                    <Button
                        name="skip"
                        title={t('welcomeScreen:skip')}
                        colorVariant="primaryBlue"
                        styleVariant="transparent"
                        onPress={handleSignUp}
                    />
                </InlineListView>
                <FlatList
                    data={slides}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.container}
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
                                    {t(item.title)}
                                </Text>
                                <Text style={styles.text}>
                                    {t(item.description)}
                                </Text>
                            </BlockListView>
                            {/* Only render button on the last slide */}
                            {itemIndex === slides.length - 1 && (
                                <Button
                                    name="Sign Up"
                                    title={t('signup:signUp')}
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
            </BlockListView>
        </Page>
    );
}
