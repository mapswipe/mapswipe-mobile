import { View } from 'react-native';

import { resolveBoxStyle } from '@/utils/layout';
import {
    getSpacingValue,
    type SpacingType,
} from '@/utils/styles';

export interface SpacerProps {
    style?: never;
    /**
     * Required for the same reason Stack's spacing is: an unspecified amount of space is how
     * inconsistent rhythm gets in. Pass 'none' for a purely flexible spacer.
     */
    size: SpacingType;
    /**
     * Also takes whatever space the parent has left over, pushing the siblings after it to the
     * far end. `size` becomes the floor the spacer keeps when there is no slack to take.
     */
    grow?: boolean;
}

/**
 * Deliberate empty space on the block axis, for the one gap in a layout that is not the
 * layout's own rhythm. A Stack's spacing comes first; this is the exception to it.
 *
 * Block axis only, because nothing needs the inline one yet: the two inline fillers in the app
 * (AccessibilityInfoModal's blank badge slot and TileGridMappingSession's page filler) are sized
 * by a size token and by measured geometry, neither of which is on the spacing scale.
 */
function Spacer(props: SpacerProps) {
    const {
        size,
        grow,
    } = props;

    const space = getSpacingValue(size);

    return (
        <View
            style={resolveBoxStyle(grow
                ? { flex: 1, minHeight: space }
                : { height: space })}
        />
    );
}

export default Spacer;
