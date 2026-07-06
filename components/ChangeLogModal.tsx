import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BlockListView from '@/components/BlockListView';
import Modal from '@/components/Modal';
import Text from '@/components/Text';
import { SCREEN_HEIGHT } from '@/constants/dimensions';

import changeLogs from '@/changeLog.json';

const LAST_VIEWED_CHANGELOG_VERSION_KEY = '@lastViewedChangelogVersion';

const allChangeLogs: Record<string, { changes: string[] } | undefined> = changeLogs;

const styles = StyleSheet.create({
    changeList: {
        maxHeight: SCREEN_HEIGHT * 0.4,
    },
    changeRow: {
        flexDirection: 'row',
        gap: 4,
    },
});

function ChangeLogModal() {
    const [visible, setVisible] = useState(false);

    const currentVersion = Constants.expoConfig?.version;

    const currentVersionChanges = useMemo(() => {
        if (!currentVersion) {
            return undefined;
        }
        return allChangeLogs[currentVersion]?.changes;
    }, [currentVersion]);

    useEffect(() => {
        if (!currentVersion || !currentVersionChanges) {
            return;
        }
        AsyncStorage.getItem(LAST_VIEWED_CHANGELOG_VERSION_KEY).then((value) => {
            if (value !== currentVersion) {
                setVisible(true);
            }
        });
    }, [currentVersion, currentVersionChanges]);

    const handleClose = useCallback(async () => {
        if (currentVersion) {
            await AsyncStorage.setItem(
                LAST_VIEWED_CHANGELOG_VERSION_KEY,
                currentVersion,
            );
        }
        setVisible(false);
    }, [currentVersion]);

    if (!currentVersionChanges) {
        return null;
    }

    return (
        <Modal
            open="change-log"
            visible={visible}
            onClose={handleClose}
            closeButtonName="Close"
        >
            <BlockListView spacing="sm">
                <Text variant="title">
                    MapSwipe has been updated!
                </Text>
                <Text>
                    {`Here's a summary of what's changed in v${currentVersion}`}
                </Text>
                <ScrollView
                    style={styles.changeList}
                    nestedScrollEnabled
                >
                    <BlockListView spacing="xs">
                        {currentVersionChanges.map((change) => (
                            <View key={change} style={styles.changeRow}>
                                <Text>-</Text>
                                <Text>{change}</Text>
                            </View>
                        ))}
                    </BlockListView>
                </ScrollView>
            </BlockListView>
        </Modal>
    );
}

export default ChangeLogModal;
