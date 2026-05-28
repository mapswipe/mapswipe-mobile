import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import BlockListView from '@/components/BlockListView';
import Icon, { type IconName } from '@/components/Icon';
import Text, { colorVariant } from '@/components/Text';
import useTheme from '@/hooks/useTheme';
import { FbObjCustomOption } from '@/utils/types';

import InstructionRow from './InstructionRow';

const ICON_PILL_SIZE = 50;

const styles = StyleSheet.create({
    pill: {
        width: ICON_PILL_SIZE,
        height: ICON_PILL_SIZE,
        borderRadius: ICON_PILL_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

interface Props {
    customOptions?: FbObjCustomOption[];
    colorVariants?: colorVariant
}

function ValidateInstructions(props: Props) {
    const { customOptions, colorVariants = 'brand' } = props;
    const { t } = useTranslation('instructionsScreen');
    const theme = useTheme();

    const options = customOptions ?? [];

    return (
        <BlockListView spacing="sm">
            <Text colorVariant={colorVariants}>
                {t('validateUseButtons')}
            </Text>
            {options.length === 0 ? (
                <Text colorVariant={colorVariants}>
                    {t('validateNoOptions')}
                </Text>
            ) : options.map((option) => (
                <InstructionRow
                    colorVariant={colorVariants}
                    key={option.value}
                    icon={(
                        <BlockListView
                            style={[styles.pill, { backgroundColor: option.iconColor }]}
                        >
                            <Icon
                                name={option.icon as IconName}
                                color={theme.card}
                                size={28}
                            />
                        </BlockListView>
                    )}
                    title={option.title}
                    description={option.description}
                />
            ))}
        </BlockListView>
    );
}

export default ValidateInstructions;
