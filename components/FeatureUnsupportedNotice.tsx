import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    View,
} from 'react-native';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import { type AppTheme } from '@/constants/theme';
import { type FeatureSupport } from '@/hooks/useFeatureSupport';
import useThemedStyles from '@/hooks/useThemedStyles';
import openAppStore from '@/utils/appStore';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    container: {
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.warning,
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    title: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    listItem: {
        flexDirection: 'row',
        gap: 6,
    },
    listItemText: {
        flex: 1,
    },
});

interface Props {
    featureSupport: FeatureSupport;
}

// Explains why a resource (eg. a project) cannot be opened in this version of the app
function FeatureUnsupportedNotice(props: Props) {
    const { featureSupport } = props;
    const {
        missingFeatures,
        updateToVersion,
        isUpdateAvailable,
    } = featureSupport;

    const { t } = useTranslation('appUpdate');
    const styles = useThemedStyles(createStyles);

    const canUpdate = !!updateToVersion || isUpdateAvailable;

    const handleUpdate = useCallback(() => {
        openAppStore();
    }, []);

    let description: string;
    if (updateToVersion) {
        description = t('featureUpdateToDescription', { version: updateToVersion });
    } else if (isUpdateAvailable) {
        description = t('featureUpdateDescription');
    } else {
        description = t('featureNotSupportedDescription');
    }

    return (
        <BlockListView
            spacing="xs"
            style={styles.container}
        >
            <View style={styles.title}>
                <Icon name="warning-outline" size={16} />
                <Text variant="label">
                    {canUpdate ? t('featureUpdateTitle') : t('featureNotSupportedTitle')}
                </Text>
            </View>
            <Text>{description}</Text>
            <BlockListView spacing="3xs">
                {missingFeatures.map((feature) => (
                    <View key={feature.key} style={styles.listItem}>
                        <Text>•</Text>
                        <View style={styles.listItemText}>
                            <Text>{feature.label ?? t('unknownFeature')}</Text>
                        </View>
                    </View>
                ))}
            </BlockListView>
            {canUpdate && (
                <Button
                    spacing="xs"
                    name="update"
                    styleVariant="filled"
                    colorVariant="primaryGreen"
                    onPress={handleUpdate}
                    title={t('update')}
                />
            )}
        </BlockListView>
    );
}

export default FeatureUnsupportedNotice;
