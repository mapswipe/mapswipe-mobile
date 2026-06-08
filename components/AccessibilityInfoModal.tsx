import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import BlockListView from '@/components/BlockListView';
import Icon from '@/components/Icon';
import Modal from '@/components/Modal';
import Text from '@/components/Text';
import InstructionRow from '@/components/tutorial/InstructionRow';

export const ACCESSIBILITY_TUTORIAL_SEEN_KEY = 'accessibility_tutorial_seen';

const BADGE_SIZE = 28;

const styles = StyleSheet.create({
    badge: {
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

interface BadgeProps {
    color: string;
    iconName: 'checkmark-outline' | 'question-mark' | 'ban-outline';
}

function AccessibilityBadge(props: BadgeProps) {
    const { color, iconName } = props;
    return (
        <View style={[styles.badge, { backgroundColor: color }]}>
            <Icon name={iconName} color="#ffffff" size={16} weight="bold" />
        </View>
    );
}

function AccessibilityInfoModal() {
    const { t } = useTranslation('AccessibilityInstruction');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(ACCESSIBILITY_TUTORIAL_SEEN_KEY).then((value) => {
            if (value === null) {
                setVisible(true);
            }
        });
    }, []);

    const handleClose = useCallback(async () => {
        await AsyncStorage.setItem(ACCESSIBILITY_TUTORIAL_SEEN_KEY, 'true');
        setVisible(false);
    }, []);

    return (
        <Modal
            open="accessibility-info"
            visible={visible}
            onClose={handleClose}
            closeButtonName={t('dontShowAgain', "Don't show me this again")}
        >
            <BlockListView spacing="sm">
                <Text variant="title">{t('heading')}</Text>
                <Text>{t('descriptions')}</Text>
                <InstructionRow
                    icon={<AccessibilityBadge color="#22C55E" iconName="checkmark-outline" />}
                    description={t('tickIconInfo')}
                    colorVariant="normal"
                />
                <InstructionRow
                    icon={<AccessibilityBadge color="#F59E0B" iconName="question-mark" />}
                    description={t('questionMarkIconInfo')}
                    colorVariant="normal"
                />
                <InstructionRow
                    icon={<AccessibilityBadge color="#EF4444" iconName="ban-outline" />}
                    description={t('badImageIconInfo')}
                    colorVariant="normal"
                />
                <InstructionRow
                    icon={<View style={{ width: BADGE_SIZE }} />}
                    description={t('turnOnOffDescription')}
                    colorVariant="normal"
                />
            </BlockListView>
        </Modal>
    );
}

export default AccessibilityInfoModal;
