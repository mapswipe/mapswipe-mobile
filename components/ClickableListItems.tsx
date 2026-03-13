// @flow
import React, { useCallback } from 'react';
import {
    Pressable,
    StyleSheet,
    View,
    ViewStyle,
} from 'react-native';

import {
    FONT_SIZE_LG,
    FONT_SIZE_MD,
    FONT_SIZE_SM,
    SPACING_3XS,
} from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import Icon from './Icon';
import InlineListView from './InlineListView';
import Text from './Text';

export type TextSize = 'sm' | 'md' | 'lg';

export type colorVariant = 'primary' | 'danger' | 'info' | 'light';

export type ClickableListItemProps<N> = {
    name?: N;
    accessibilityLabel?: string;
    showChevronIcon?: boolean;
    after?: React.ReactNode;
    before?: React.ReactNode;
    onPress?: (name?: N) => void;
    title: string;
    textSize?: TextSize;
    colorVariant?: colorVariant;
    style?: ViewStyle | ViewStyle[];
    isActive?: boolean
};

const createStyles = (
    theme: AppTheme,
    textSize: TextSize,
    colorVariant: colorVariant,
) => {
    const fontSizeMap = {
        sm: FONT_SIZE_SM,
        md: FONT_SIZE_MD,
        lg: FONT_SIZE_LG,
    };

    const colorVariantMap = {
        primary: theme.textPrimary,
        danger: theme.primaryRed,
        info: theme.info,
        light: theme.textOnPrimary,
    };

    return StyleSheet.create({
        default: {
            backgroundColor: theme.card,
        },
        active: {
            backgroundColor: theme.divider,
        },
        list: {
            alignItems: 'center',
        },
        text: {
            flex: 1,
            fontSize: fontSizeMap[textSize],
            color: colorVariantMap[colorVariant],
        },
        icon: {
            opacity: 0.5,
            marginLeft: SPACING_3XS,
        },
        rightContent: {
            flexGrow: 0,
            alignItems: 'center',
        },
    });
};

function ClickableListItem<N = unknown>({
    name,
    title,
    onPress,
    accessibilityLabel,
    style,
    after,
    before,
    showChevronIcon = false,
    textSize = 'sm',
    colorVariant = 'primary',
    isActive,
}: ClickableListItemProps<N>) {
    const styles = useThemedStyles((theme) => createStyles(theme, textSize, colorVariant));
    const handlePress = useCallback(() => {
        onPress?.(name);
    }, [onPress, name]);

    return (
        <Pressable
            onPress={handlePress}
            style={[isActive ? styles.active : styles.default, style]}
        >
            <View
                accessible
                accessibilityLabel={accessibilityLabel ?? title}
                accessibilityRole="button"
            >
                <InlineListView
                    withPadding
                    withSpaceBetweenContents
                    style={styles.list}
                    spacing="xs"
                >
                    {before}
                    <Text style={styles.text}>
                        {title}
                    </Text>
                    <InlineListView
                        spacing="none"
                        style={styles.rightContent}
                    >
                        {after}
                        {showChevronIcon && (
                            <Icon
                                name="caret-right"
                                style={styles.icon}
                                size={18}
                            />
                        )}
                    </InlineListView>
                </InlineListView>
            </View>
        </Pressable>
    );
}

export default ClickableListItem;
