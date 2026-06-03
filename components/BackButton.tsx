import React, { useCallback } from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeftIcon } from 'phosphor-react-native';

import useTheme from '@/hooks/useTheme';

interface Props {
    style?: ViewStyle;
    onPress?: () => void;
}
const styles = StyleSheet.create({
    button: {
        paddingRight: 16,
    },
});

export default function BackButton({ style, onPress }: Props) {
    const router = useRouter();
    const theme = useTheme();

    const handleBack = useCallback(() => {
        if (onPress) {
            onPress();
            return;
        }
        if (router.canGoBack()) {
            router.back();
        } else {
            router.push('/');
        }
    }, [router, onPress]);

    return (
        <TouchableOpacity
            onPress={handleBack}
            style={[styles.button, style]}
            activeOpacity={0.7}
        >
            <ArrowLeftIcon
                color={theme.card}
            />
        </TouchableOpacity>
    );
}
