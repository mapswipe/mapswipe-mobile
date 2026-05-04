import {
    StyleSheet,
    View,
} from 'react-native';

import Icon, { type IconName } from '@/components/Icon';
import Text from '@/components/Text';
import {
    SPACING_2XS,
    SPACING_4XS,
    SPACING_XS,
} from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    FbScreen,
    FbScreenBlock,
} from '@/utils/types';

import { ScenarioState } from './types';

type Tone = 'instructions' | 'hint' | 'success';

const createStyles = (theme: AppTheme, { tone }: { tone: Tone }) => {
    const colorMap: Record<Tone, string> = {
        instructions: theme.info,
        hint: theme.warning,
        success: theme.success,
    };

    return StyleSheet.create({
        card: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: SPACING_2XS,
            borderRadius: 12,
            padding: SPACING_XS,
            backgroundColor: colorMap[tone],
        },
        iconWrapper: {
            paddingTop: 2,
        },
        body: {
            flex: 1,
            gap: SPACING_4XS,
        },
        title: {
            color: theme.textOnPrimary,
            fontWeight: 'bold',
        },
        description: {
            color: theme.textOnPrimary,
        },
    });
};

interface CardProps {
    tone: Tone;
    block: FbScreenBlock;
    descriptionSuffix?: string;
}

function FeedbackCard(props: CardProps) {
    const { tone, block, descriptionSuffix } = props;
    const styles = useThemedStyles(createStyles, { tone });
    const description = descriptionSuffix
        ? `${block.description} ${descriptionSuffix}`
        : block.description;

    return (
        <View style={styles.card}>
            <View style={styles.iconWrapper}>
                <Icon
                    name={block.icon as IconName}
                    color="#ffffff"
                    size={24}
                />
            </View>
            <View style={styles.body}>
                <Text style={styles.title}>{block.title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>
        </View>
    );
}

interface Props {
    screen: FbScreen;
    state: ScenarioState;
}

function ScenarioFeedback(props: Props) {
    const { screen, state } = props;

    if (state === 'correct') {
        return <FeedbackCard tone="success" block={screen.success} />;
    }

    if (state === 'answers-shown') {
        return <FeedbackCard tone="hint" block={screen.hint} />;
    }

    return <FeedbackCard tone="instructions" block={screen.instructions} />;
}

export default ScenarioFeedback;
