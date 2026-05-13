import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import {
    CheckIcon,
    SelectionIcon,
} from 'phosphor-react-native';

import BlockListView from '@/components/BlockListView';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import { FbObjCustomOption } from '@/utils/types';

import InstructionRow from './InstructionRow';
import TapBadgeIcon from './TapBadgeIcon';

const styles = StyleSheet.create({
    sectionHeading: {
        fontWeight: 'bold',
    },
});

interface Props {
    customOptions?: FbObjCustomOption[];
}

function LocateInstructions(props: Props) {
    const { customOptions } = props;
    const { t } = useTranslation('instructionsScreen');

    const tapOptions = (customOptions ?? [])
        .filter((option) => option.value > 0)
        .sort((a, b) => a.value - b.value);

    return (
        <BlockListView spacing="sm">
            <Text colorVariant="brand">
                {t('locateIntro')}
            </Text>

            <InstructionRow
                icon={<Icon name="hand-left-outline" color="#FFFFFF" size={40} />}
                description={t('locateSwipe')}
            />

            {tapOptions.map((option) => (
                <InstructionRow
                    key={option.value}
                    icon={(
                        <TapBadgeIcon
                            iconName="tap"
                            badgeNumber={option.value}
                            badgeColor={option.iconColor}
                        />
                    )}
                    title={option.title}
                    description={option.description}
                />
            ))}

            <InstructionRow
                icon={<Icon name="tap" color="#FFFFFF" size={40} />}
                description={t('locateTapReset')}
            />

            <Text colorVariant="brand" style={styles.sectionHeading}>
                {t('locateMultiSelectSection')}
            </Text>

            <InstructionRow
                icon={<SelectionIcon color="#FFFFFF" size={40} />}
                description={t('locateMultiSelectDrag')}
            />

            <InstructionRow
                icon={<CheckIcon color="#FFFFFF" size={40} />}
                description={t('locateMultiSelectConfirm')}
            />
        </BlockListView>
    );
}

export default LocateInstructions;
