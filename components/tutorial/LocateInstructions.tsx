import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import {
    CheckIcon,
    SelectionIcon,
} from 'phosphor-react-native';

import BlockListView from '@/components/BlockListView';
import Icon from '@/components/Icon';
import Text, { ColorVariant } from '@/components/Text';
import useTheme from '@/hooks/useTheme';
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
        colorVariants? : ColorVariant

}

function LocateInstructions(props: Props) {
    const { customOptions, colorVariants = 'brand' } = props;
    const { t } = useTranslation('instructionsScreen');
    const theme = useTheme();
    const iconColor = colorVariants === 'brand' ? theme.textOnBrand : theme.textPrimary;

    const tapOptions = (customOptions ?? [])
        .filter((option) => option.value > 0)
        .sort((a, b) => a.value - b.value);

    return (
        <BlockListView spacing="sm">
            <Text colorVariant={colorVariants}>
                {t('locateIntro')}
            </Text>

            <InstructionRow
                icon={<Icon name="hand-left-outline" color={iconColor} size={40} />}
                description={t('locateSwipe')}
            />

            {tapOptions.map((option) => (
                <InstructionRow
                    colorVariant={colorVariants}
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
                colorVariant={colorVariants}
                icon={<Icon name="tap" color={iconColor} size={40} />}
                description={t('locateTapReset')}
            />

            <Text colorVariant={colorVariants} style={styles.sectionHeading}>
                {t('locateMultiSelectSection')}
            </Text>

            <InstructionRow
                colorVariant={colorVariants}
                icon={<SelectionIcon color={iconColor} size={40} />}
                description={t('locateMultiSelectDrag')}
            />

            <InstructionRow
                colorVariant={colorVariants}
                icon={<CheckIcon color={iconColor} size={40} />}
                description={t('locateMultiSelectConfirm')}
            />
        </BlockListView>
    );
}

export default LocateInstructions;
