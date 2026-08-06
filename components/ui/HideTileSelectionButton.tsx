import { useTranslation } from 'react-i18next';

import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
import { getSpacingValue } from '@/utils/styles';

type SizeVariant = 'small' | 'large';

const SIZE_VARIANT = {
    small: 'sm',
    large: 'md',
} as const satisfies Record<SizeVariant, 'sm' | 'md'>;

const CONTAINER_INSET_END = getSpacingValue('2xs');
const CONTAINER_INSET_BOTTOM = getSpacingValue('sm');

interface HideTileSelectionButtonProps {
    style?: never;
    handleHideTileSelectionPressIn: () => void;
    handleHideTileSelectionPressOut: () => void;
    size?: SizeVariant;
    /** For a caller that already positions the button. */
    withoutContainer?: boolean;
}

function HideTileSelectionButton(props: HideTileSelectionButtonProps) {
    const {
        handleHideTileSelectionPressIn,
        handleHideTileSelectionPressOut,
        size = 'small',
        withoutContainer,
    } = props;

    const { t } = useTranslation('mappingSession');

    const button = (
        <IconButton
            name="hide"
            iconName="eye-closed"
            accessibilityLabel={t('hideTileOverlay')}
            sizeVariant={SIZE_VARIANT[size]}
            styleVariant="outlined"
            colorVariant="onImage"
            onPressIn={handleHideTileSelectionPressIn}
            onPressOut={handleHideTileSelectionPressOut}
        />
    );

    if (withoutContainer) {
        return button;
    }

    return (
        <Box
            align="end"
            paddingEnd={size === 'small' ? CONTAINER_INSET_END : undefined}
            paddingBlockEnd={CONTAINER_INSET_BOTTOM}
        >
            {button}
        </Box>
    );
}

export default HideTileSelectionButton;
