import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import BlockListView from '@/components/BlockListView';
import Icon, { type IconName } from '@/components/Icon';
import Text from '@/components/Text';
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
}

function ValidateInstructions(props: Props) {
    const { customOptions } = props;
    const { t } = useTranslation('instructionsScreen');

    const options = customOptions ?? [];

    return (
        <BlockListView spacing="sm">
            <Text colorVariant="brand">
                {t('validateUseButtons')}
            </Text>
            {options.length === 0 ? (
                <Text colorVariant="brand">
                    {t('validateNoOptions')}
                </Text>
            ) : options.map((option) => (
                <InstructionRow
                    key={option.value}
                    icon={(
                        <BlockListView
                            style={[styles.pill, { backgroundColor: option.iconColor }]}
                        >
                            <Icon
                                name={option.icon as IconName}
                                color="#FFFFFF"
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
