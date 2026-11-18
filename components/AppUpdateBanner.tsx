import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import Icon from '@/components/Icon';
import Text from '@/components/Text';
import { type AppTheme } from '@/constants/theme';
import AppUpdateContext from '@/contexts/appUpdate';
import useThemedStyles from '@/hooks/useThemedStyles';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: theme.backgroundBrand,
    },
    content: {
        flex: 1,
    },
    text: {
        color: theme.textOnBrand,
        fontSize: 13,
        fontWeight: '700',
    },
    action: {
        color: theme.textOnBrand,
        fontSize: 13,
        textDecorationLine: 'underline',
    },
});

// Short banner shown while a newer version of the app is available.
// Tapping it opens the update popup.
function AppUpdateBanner() {
    const { t } = useTranslation('appUpdate');
    const styles = useThemedStyles(createStyles);
    const {
        latestVersion,
        isUpdateAvailable,
        showUpdatePrompt,
    } = useContext(AppUpdateContext);

    if (!isUpdateAvailable) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.banner}
            activeOpacity={0.7}
            onPress={showUpdatePrompt}
            accessibilityRole="button"
        >
            <Icon
                name="refresh-outline"
                size={18}
                color={styles.text.color}
            />
            <View style={styles.content}>
                <Text style={styles.text}>
                    {t('bannerText', { latestVersion })}
                </Text>
            </View>
            <Text style={styles.action}>
                {t('bannerAction')}
            </Text>
        </TouchableOpacity>
    );
}

export default AppUpdateBanner;
