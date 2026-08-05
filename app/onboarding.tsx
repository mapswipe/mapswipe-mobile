import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import welcome1 from '@/assets/images/custom/welcome1.png';
import welcome2 from '@/assets/images/custom/welcome2.png';
import welcome3 from '@/assets/images/custom/welcome3.png';
import welcome4 from '@/assets/images/custom/welcome4.png';
import welcome5 from '@/assets/images/custom/welcome5.png';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Media, { type MediaSource } from '@/components/ui/Media';
import PageIndicator from '@/components/ui/PageIndicator';
import Pager, { type PageGeometry } from '@/components/ui/Pager';
import Positioned from '@/components/ui/Positioned';
import Screen from '@/components/ui/Screen';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { SCREEN_FRACTION } from '@/constants/size';

interface Slide {
    id: string;
    title: string;
    description: string;
    imageUrl: MediaSource;
}

const slides: Slide[] = [
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

function keySelector(item: Slide): string {
    return item.id;
}

function Onboarding() {
    const [index, setIndex] = useState(0);
    const router = useRouter();
    const { t } = useTranslation(['welcomeScreen', 'signup']);

    const handleIndexChange = useCallback((pageIndex: number) => {
        setIndex(pageIndex);
    }, []);

    const handleSignUp = useCallback(async () => {
        try {
            await AsyncStorage.setItem('@hasSeenOnboarding', 'true');
            router.replace('/register');
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error saving onboarding state:', error);
        }
    }, [router]);

    const renderPage = useCallback(
        (item: Slide, itemIndex: number, geometry: PageGeometry) => (
            <Stack
                spacing="md"
                padding="md"
                align="center"
                justify="center"
                grow="fill"
            >
                {/* The footprint is a measured Box and the bitmap spans it: Media's spanning
                    rungs are a fixed 200 and 240 tall, and this illustration is a fraction of
                    the page it is dealt into. */}
                <Box
                    width={geometry.width * SCREEN_FRACTION.contentWidth}
                    height={geometry.height * SCREEN_FRACTION.heroHeight}
                >
                    <Media
                        source={item.imageUrl}
                        sizeVariant="fill"
                        fit="contain"
                        withoutAccessibilityLabel
                    />
                </Box>
                <Stack
                    spacing="md"
                    padding="md"
                    align="center"
                >
                    {/* ui/Text has no width, so each block is bounded by the Box around it. Both
                        fractions are of the measured page, as they were of SCREEN_WIDTH. */}
                    <Box width={geometry.width * SCREEN_FRACTION.headingWidth}>
                        <Text
                            variant="display"
                            // `brand`, whose content slot IS theme.primaryBlue. Not `default`:
                            // that is textPrimary, a near-black that flips to near-white in the
                            // dark theme, and this page is not a brand-backed one.
                            colorVariant="brand"
                            align="center"
                        >
                            {t(item.title)}
                        </Text>
                    </Box>
                    <Box width={geometry.width * SCREEN_FRACTION.contentWidth}>
                        <Text
                            variant="description"
                            colorVariant="brand"
                            align="center"
                        >
                            {t(item.description)}
                        </Text>
                    </Box>
                </Stack>
                {/* Only render button on the last slide */}
                {itemIndex === slides.length - 1 && (
                    <Button
                        title={t('signup:signUp')}
                        accessibilityLabel={t('signup:signUp')}
                        colorVariant="negative"
                        onPress={handleSignUp}
                    />
                )}
            </Stack>
        ),
        [t, handleSignUp],
    );

    return (
        <Screen
            title="onboarding"
            layout="fill"
            chrome={(
                <>
                    <Positioned
                        anchor="topEnd"
                        offset="3xs"
                    >
                        <Button
                            title={t('welcomeScreen:skip')}
                            accessibilityLabel={t('welcomeScreen:skip')}
                            colorVariant="brand"
                            styleVariant="transparent"
                            width="hug"
                            onPress={handleSignUp}
                        />
                    </Positioned>
                    <Positioned
                        anchor="bottom"
                        offsetBlock="3xl"
                    >
                        {/* `brand`: the active dot is the role's content, i.e. the same navy the
                            page drew as backgroundBrand, and its spent dots are the grey rung.
                            `onBrand` is the tutorial's white pair and would vanish here. */}
                        <PageIndicator
                            count={slides.length}
                            currentIndex={index}
                            colorVariant="brand"
                            spacing="2xs"
                        />
                    </Positioned>
                </>
            )}
        >
            <Pager
                data={slides}
                keyExtractor={keySelector}
                renderPage={renderPage}
                onIndexChange={handleIndexChange}
                sizeVariant="page"
            />
        </Screen>
    );
}

export default Onboarding;
