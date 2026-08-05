import {
    useCallback,
    useEffect,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import InstructionRow from '@/components/tutorial/InstructionRow';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Modal from '@/components/ui/Modal';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { ANSWER_OPTIONS } from '@/constants/answers';
import { ICON_SIZE } from '@/constants/size';
import useAnswerColors from '@/hooks/useAnswerColors';

export const ACCESSIBILITY_TUTORIAL_SEEN_KEY = 'accessibility_tutorial_seen';

// Built-in answers only: a project's customOptions never reach this legend.
const LEGEND = [
    { option: ANSWER_OPTIONS.yes, descriptionKey: 'tickIconInfo' },
    { option: ANSWER_OPTIONS.maybe, descriptionKey: 'questionMarkIconInfo' },
    { option: ANSWER_OPTIONS.badImagery, descriptionKey: 'badImageIconInfo' },
] as const;

const LEGEND_OPTIONS = LEGEND.map(({ option }) => option);

// Must match the badge footprint so the last row's text lines up with the rows above.
const BADGE_EXTENT = ICON_SIZE['3xl'];

function AccessibilityInfoModal() {
    const { t } = useTranslation('AccessibilityInstruction');
    const [visible, setVisible] = useState(false);

    const answerColors = useAnswerColors(LEGEND_OPTIONS);

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
            visible={visible}
            onClose={handleClose}
            closeLabel={t('dontShowAgain', "Don't show me this again")}
        >
            <Stack spacing="sm">
                <Text variant="title">{t('heading')}</Text>
                <Text>{t('descriptions')}</Text>
                {LEGEND.map(({ option, descriptionKey }) => (
                    <InstructionRow
                        key={option.value}
                        icon={(
                            <Badge
                                shape="square"
                                sizeVariant="lg"
                                dotColor={answerColors[option.value].badgeColor}
                                iconName={option.iconName}
                                iconEmphasis="strong"
                            />
                        )}
                        description={t(descriptionKey)}
                        colorVariant="normal"
                    />
                ))}
                <InstructionRow
                    icon={<Box width={BADGE_EXTENT} />}
                    description={t('turnOnOffDescription')}
                    colorVariant="normal"
                />
            </Stack>
        </Modal>
    );
}

export default AccessibilityInfoModal;
