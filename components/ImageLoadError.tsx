import { useTranslation } from 'react-i18next';
import {
    Pressable,
    StyleSheet,
    View,
} from 'react-native';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import { type AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: theme.overlay,
        maxWidth: '90%',
    },
    compactButton: {
        padding: 6,
        borderRadius: 16,
        backgroundColor: theme.overlay,
    },
    icon: {
        flexShrink: 0,
    },
    text: {
        flexShrink: 1,
        color: theme.textOnPrimary,
        fontSize: 12,
    },
});

interface Props {
    onRetry: () => void;
    compact?: boolean;
}

function ImageLoadError(props: Props) {
    const { onRetry, compact = false } = props;
    const { t } = useTranslation('mappingSession');
    const styles = useThemedStyles(createStyles);
    const theme = useTheme();

    return (
        <View style={styles.container} pointerEvents="box-none">
            <Pressable
                onPress={onRetry}
                style={compact ? styles.compactButton : styles.button}
                accessibilityRole="button"
                accessibilityLabel={t('imageLoadFailedRetry')}
                hitSlop={8}
            >
                <View style={styles.icon}>
                    <Icon
                        name="refresh-outline"
                        color={theme.textOnPrimary}
                        size={compact ? 18 : 14}
                    />
                </View>
                {!compact && (
                    <Text style={styles.text} numberOfLines={2}>
                        {t('imageLoadFailedRetry')}
                    </Text>
                )}
            </Pressable>
        </View>
    );
}

export default ImageLoadError;
