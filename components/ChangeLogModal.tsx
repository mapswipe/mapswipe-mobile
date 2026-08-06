import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BulletList from '@/components/ui/BulletList';
import Modal from '@/components/ui/Modal';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';

import changeLogs from '@/changeLog.json';

const LAST_VIEWED_CHANGELOG_VERSION_KEY = '@lastViewedChangelogVersion';

const CLOSE_LABEL = 'Close';

const allChangeLogs: Record<string, { changes: string[] } | undefined> = changeLogs;

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
            if (value === null) {
                AsyncStorage.setItem(
                    LAST_VIEWED_CHANGELOG_VERSION_KEY,
                    currentVersion,
                );
                return;
            }
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
            visible={visible}
            onClose={handleClose}
            closeLabel={CLOSE_LABEL}
        >
            <Stack spacing="sm">
                <Text variant="title">
                    MapSwipe has been updated!
                </Text>
                <Text>
                    {`Here's a summary of what's changed in v${currentVersion}`}
                </Text>
                <BulletList items={currentVersionChanges} />
            </Stack>
        </Modal>
    );
}

export default ChangeLogModal;
