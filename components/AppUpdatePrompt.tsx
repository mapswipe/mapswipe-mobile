import {
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isDefined } from '@togglecorp/fujs';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import MarkdownText from '@/components/MarkdownText';
import Modal from '@/components/Modal';
import Text from '@/components/Text';
import { type AppTheme } from '@/constants/theme';
import AppUpdateContext, { type AppUpdateContextProps } from '@/contexts/appUpdate';
import useAppUpdate from '@/hooks/useAppUpdate';
import useThemedStyles from '@/hooks/useThemedStyles';
import openAppStore from '@/utils/appStore';

// NOTE: The popup opens by itself once per latest version. It can be opened again from the banner.
const LAST_PROMPTED_UPDATE_VERSION_KEY = '@lastPromptedUpdateVersion';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    incompatibleChanges: {
        borderRadius: 6,
        borderWidth: 1,
        borderColor: theme.warning,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    sectionTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    versionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: theme.textSecondary,
    },
});

interface AppUpdateModalProps {
    visible: boolean;
    appUpdate: AppUpdateContextProps;
    onLater: () => void;
}

function AppUpdateModal(props: AppUpdateModalProps) {
    const {
        visible,
        appUpdate,
        onLater,
    } = props;
    const {
        installedVersion,
        latestVersion,
        isUpdateRequired,
        missedReleases,
    } = appUpdate;

    const { t } = useTranslation('appUpdate');
    const styles = useThemedStyles(createStyles);

    const releasesWithIncompatibleChanges = missedReleases.filter(
        (release) => !!release.incompatibleChanges?.trim(),
    );
    // NOTE: Newest first
    const releasesWithUpdates = missedReleases.filter(
        (release) => !!release.updates?.trim(),
    ).reverse();

    const handleUpdate = useCallback(() => {
        openAppStore();
    }, []);

    return (
        <Modal
            open="app-update"
            visible={visible}
            // NOTE: Cannot be dismissed when the update is required
            onClose={isUpdateRequired ? undefined : onLater}
            closeButtonName={t('later')}
            closeButtonStyleVariant="outline"
            footer={(
                <Button
                    spacing="xs"
                    name="update"
                    styleVariant="filled"
                    colorVariant="primaryGreen"
                    onPress={handleUpdate}
                    title={t('update')}
                />
            )}
        >
            <BlockListView spacing="sm">
                <BlockListView spacing="2xs">
                    <Text variant="title">
                        {isUpdateRequired ? t('updateRequiredTitle') : t('updateAvailableTitle')}
                    </Text>
                    <Text>
                        {isUpdateRequired
                            ? t('updateRequiredDescription', { installedVersion })
                            : t('updateAvailableDescription', { installedVersion, latestVersion })}
                    </Text>
                </BlockListView>
                {releasesWithIncompatibleChanges.length > 0 && (
                    <BlockListView
                        spacing="xs"
                        style={styles.incompatibleChanges}
                    >
                        <View style={styles.sectionTitle}>
                            <Icon name="warning-outline" size={16} />
                            <Text variant="label">
                                {t('incompatibleChangesTitle')}
                            </Text>
                        </View>
                        {releasesWithIncompatibleChanges.map((release) => (
                            <BlockListView key={release.version} spacing="3xs">
                                <Text style={styles.versionTitle}>
                                    {t('versionTitle', { version: release.version })}
                                </Text>
                                <MarkdownText>{release.incompatibleChanges}</MarkdownText>
                            </BlockListView>
                        ))}
                    </BlockListView>
                )}
                {releasesWithUpdates.length > 0 && (
                    <BlockListView spacing="xs">
                        <Text variant="label">
                            {t('whatsNewTitle')}
                        </Text>
                        {releasesWithUpdates.map((release) => (
                            <BlockListView key={release.version} spacing="3xs">
                                <Text style={styles.versionTitle}>
                                    {t('versionTitle', { version: release.version })}
                                </Text>
                                <MarkdownText>{release.updates}</MarkdownText>
                            </BlockListView>
                        ))}
                    </BlockListView>
                )}
            </BlockListView>
        </Modal>
    );
}

interface Props {
    children: ReactNode;
}

// Checks if a newer version of the app is available and shows the update popup.
// The popup can be dismissed, unless the installed version is no longer supported.
function AppUpdatePrompt(props: Props) {
    const { children } = props;

    const appUpdate = useAppUpdate();
    const {
        latestVersion,
        isUpdateAvailable,
        isUpdateRequired,
    } = appUpdate;

    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!isUpdateAvailable || !isDefined(latestVersion)) {
            return undefined;
        }
        let mounted = true;
        AsyncStorage.getItem(LAST_PROMPTED_UPDATE_VERSION_KEY).then((value) => {
            if (mounted && value !== latestVersion) {
                setVisible(true);
            }
        }).catch(() => {
            // NOTE: The banner still gives access to the popup
        });
        return () => {
            mounted = false;
        };
    }, [isUpdateAvailable, latestVersion]);

    const handleLater = useCallback(() => {
        setVisible(false);
        if (isDefined(latestVersion)) {
            AsyncStorage.setItem(LAST_PROMPTED_UPDATE_VERSION_KEY, latestVersion).catch(() => {});
        }
    }, [latestVersion]);

    const showUpdatePrompt = useCallback(() => {
        setVisible(true);
    }, []);

    const contextValue = useMemo(() => ({
        ...appUpdate,
        showUpdatePrompt,
    }), [appUpdate, showUpdatePrompt]);

    return (
        <AppUpdateContext.Provider value={contextValue}>
            {children}
            <AppUpdateModal
                visible={isUpdateRequired || (isUpdateAvailable && visible)}
                appUpdate={contextValue}
                onLater={handleLater}
            />
        </AppUpdateContext.Provider>
    );
}

export default AppUpdatePrompt;
