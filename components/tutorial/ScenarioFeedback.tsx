import Banner, { type BannerColorVariant } from '@/components/ui/Banner';
import { type IconName } from '@/components/ui/Icon';
import {
    FbScreen,
    FbScreenBlock,
} from '@/utils/types';

import { ScenarioState } from './types';

interface Props {
    screen: FbScreen;
    state: ScenarioState;
}

function ScenarioFeedback(props: Props) {
    const { screen, state } = props;

    let colorVariant: BannerColorVariant = 'informative';
    let block: FbScreenBlock = screen.instructions;

    if (state === 'correct') {
        colorVariant = 'positive';
        block = screen.success;
    } else if (state === 'answers-shown') {
        colorVariant = 'notice';
        block = screen.hint;
    }

    return (
        <Banner
            colorVariant={colorVariant}
            title={block.title}
            message={block.description}
            // FIXME: No casting. Unvalidated glyph name off Firebase.
            iconName={block.icon as IconName}
        />
    );
}

export default ScenarioFeedback;
