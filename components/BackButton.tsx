import React, { useCallback } from 'react';
import {
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';

import useTheme from '@/hooks/useTheme';

import Icon from './Icon';

interface Props {
    style?: ViewStyle;
}

export default function BackButton({ style }: Props) {
    const router = useRouter();
    const theme = useTheme();

    const handleBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.push('/');
        }
    }, [router]);

    return (
        <TouchableOpacity
            onPress={handleBack}
            style={style}
            activeOpacity={0.7}
        >
            <Icon
                color={theme.card}
                name="swipe-left"
            />
        </TouchableOpacity>
    );
}
