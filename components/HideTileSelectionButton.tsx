import React from 'react';
import { StyleSheet } from 'react-native';

import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import IconButton from './IconButton';

type sizeVariant = 'small' | 'large'

const createStyles = (
    theme: AppTheme,
    options: { size: sizeVariant, isPressed : boolean },
) => StyleSheet.create({
    container: {
        alignItems: 'flex-end',
        paddingRight: 14,
    },
    button: {
        backgroundColor: `${theme.backgroundTrack}66`,
        width: options.size === 'small' ? 30 : 40,
        borderColor: theme.card,
        borderWidth: 1,
        opacity: options.isPressed ? 0.3 : 1,

    },
});

interface HideTileSelectionButtonProps {
    handleHideTileSelectionPress? : () => void
    size?:sizeVariant
    isPressed: boolean
}

function HideTileSelectionButton(props:HideTileSelectionButtonProps) {
    const { handleHideTileSelectionPress, isPressed, size = 'small' } = props;
    const styles = useThemedStyles(createStyles, {
        size,
        isPressed,
    });

    return (
        <IconButton
            onPressIn={handleHideTileSelectionPress}
            onPressOut={handleHideTileSelectionPress}
            stylesContainer={styles.container}
            stylesButton={styles.button}
            iconName="eye-closed"
            name="hide"
            size={size === 'small' ? 16 : 20}

        />
    );
}

export default HideTileSelectionButton;
