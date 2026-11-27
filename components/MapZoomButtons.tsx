import {
    StyleSheet,
    type ViewStyle,
} from 'react-native';

import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';

import BlockListView from './BlockListView';
import IconButton from './IconButton';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    button: {
        backgroundColor: `${theme.backgroundTrack}66`,
        width: 30,
        borderColor: theme.card,
        borderWidth: 1,
    },
});

interface Props {
    onZoomIn: () => void;
    onZoomOut: () => void;
    zoomInDisabled?: boolean;
    zoomOutDisabled?: boolean;
    containerStyle?: ViewStyle | ViewStyle[];
}

function MapZoomButtons(props: Props) {
    const {
        onZoomIn,
        onZoomOut,
        zoomInDisabled,
        zoomOutDisabled,
        containerStyle,
    } = props;

    const styles = useThemedStyles(createStyles);

    return (
        <BlockListView spacing="xs" style={containerStyle}>
            <IconButton
                name="zoom-in"
                iconName="add-outline"
                onPress={onZoomIn}
                disabled={zoomInDisabled}
                stylesButton={styles.button}
                size={16}
            />
            <IconButton
                name="zoom-out"
                iconName="remove-outline"
                onPress={onZoomOut}
                disabled={zoomOutDisabled}
                stylesButton={styles.button}
                size={16}
            />
        </BlockListView>
    );
}

export default MapZoomButtons;
