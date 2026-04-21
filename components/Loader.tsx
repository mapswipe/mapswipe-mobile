import {
    useEffect,
    useState,
} from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import loadingGif from '@/assets/images/custom/loadinganimation.gif';
import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

const { width, height } = Dimensions.get('window');

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        backgroundColor: theme.backgroundBrand,
        width,
        height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    animatedContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width,
    },
    image: {
        width: 100,
        height: 100,
    },
    loadingText: {
        color: '#ffffff',
        fontWeight: '300',
        fontSize: 20,
        marginTop: 20,
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
});

type Props = {
    label?: string,
    actions?: React.ReactNode,
};

function LoadingComponent(props: Props) {
    const { label, actions } = props;
    const styles = useThemedStyles(createStyles);

    const [animOpacity] = useState(new Animated.Value(0));
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animOpacity, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.in(Easing.sin),
                    useNativeDriver: false,
                }),
                Animated.timing(animOpacity, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.in(Easing.sin),
                    useNativeDriver: false,
                }),
            ]),
        );

        animation.start();

        const timer = setTimeout(() => {
            setShowActions(true);
        }, 3000);

        return () => {
            animation.stop();
            clearTimeout(timer);
        };
    }, [animOpacity]);

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.animatedContainer,
                    { opacity: animOpacity },
                ]}
            >
                <Image
                    style={styles.image}
                    source={loadingGif}
                />
            </Animated.View>

            <Text style={styles.loadingText} testID="loading-icon">
                {label || ('loading')}
            </Text>

            {showActions && actions}
        </View>
    );
}

export default LoadingComponent;
