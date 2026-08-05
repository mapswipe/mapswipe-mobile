import { useTranslation } from 'react-i18next';

import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
import { getSpacingValue } from '@/utils/styles';

type SizeVariant = 'small' | 'large';

/** 30 and 40, which are ui/IconButton's `sm` and `md` footprints. */
const SIZE_RUNG = {
    small: 'sm',
    large: 'md',
} as const satisfies Record<SizeVariant, 'sm' | 'md'>;

const CONTAINER_INSET_END = getSpacingValue('2xs');
const CONTAINER_INSET_BOTTOM = getSpacingValue('sm');

interface HideTileSelectionButtonProps {
    /** Both halves, because ui/IconButton treats a hold that cannot end as a mistake. */
    handleHideTileSelectionPressIn: () => void;
    handleHideTileSelectionPressOut: () => void;
    size?: SizeVariant;
    /** For a caller that already positions the button, e.g. inside a Positioned corner. */
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
            sizeVariant={SIZE_RUNG[size]}
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
