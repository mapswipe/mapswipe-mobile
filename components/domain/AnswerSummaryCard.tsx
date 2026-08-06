import { useTranslation } from 'react-i18next';
import { isDefined } from '@togglecorp/fujs';

import Divider from '@/components/ui/Divider';
import Icon from '@/components/ui/Icon';
import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import StatRow from '@/components/ui/StatRow';
import Surface from '@/components/ui/Surface';
import Text from '@/components/ui/Text';
import { type ColorVariant } from '@/constants/theme';
import { type AnswerCount } from '@/utils/results';

// Built-in answers use CSS colour names as stand-ins for theme colours; projects send raw ones.
const SENTINEL_COLOR_VARIANT: Record<string, ColorVariant> = {
    transparent: 'muted',
    green: 'positive',
    yellow: 'notice',
    red: 'negative',
};

const BACKEND_VALUE_COLOR_VARIANT: ColorVariant = 'onBrand';

function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    if (totalSeconds < 60) {
        return `${totalSeconds} sec`;
    }
    return `${Math.round(totalSeconds / 60)} min`;
}

export interface AnswerSummaryCardProps {
    answerCounts: AnswerCount[];
    reviewedCount?: number;
    durationMs?: number;
}

function AnswerSummaryCard(props: AnswerSummaryCardProps) {
    const {
        answerCounts,
        reviewedCount,
        durationMs,
    } = props;

    const { t } = useTranslation('mappingSession');

    const hasAnswers = answerCounts.length > 0;
    const showCard = hasAnswers
        || isDefined(durationMs)
        || (isDefined(reviewedCount) && reviewedCount > 0);

    if (!showCard) {
        return null;
    }

    return (
        <Surface
            flex="stretch"
            styleVariant="outlined"
            colorVariant="onBrand"
            radius="lg"
            paddingBlock="sm"
            paddingInline="xs"
        >
            {hasAnswers && (
                <Stack spacing="3xs">
                    {answerCounts.map((answer) => {
                        const sentinelColorVariant = SENTINEL_COLOR_VARIANT[answer.color];
                        const isSentinel = sentinelColorVariant !== undefined;

                        return (
                            <StatRow
                                key={answer.value}
                                label={answer.label}
                                value={String(answer.count)}
                                labelColorVariant="onBrand"
                                colorVariant={isSentinel
                                    ? sentinelColorVariant
                                    : BACKEND_VALUE_COLOR_VARIANT}
                                dotColorVariant={sentinelColorVariant}
                                // dotColor wins over dotColorVariant; sentinels must not set it.
                                dotColor={isSentinel ? undefined : answer.color}
                            />
                        );
                    })}
                </Stack>
            )}
            {hasAnswers && (
                <Divider
                    colorVariant="onBrand"
                    spacing="xs"
                />
            )}
            <Row
                spacing="3xs"
                justify="between"
            >
                {isDefined(reviewedCount) && (
                    <Text
                        variant="label"
                        colorVariant="onBrand"
                    >
                        {t('tilesReviewed', { count: reviewedCount })}
                    </Text>
                )}
                {isDefined(durationMs) && (
                    <Row spacing="4xs">
                        <Icon
                            name="time-outline"
                            sizeVariant="sm"
                            colorVariant="onBrand"
                        />
                        <Text
                            variant="label"
                            colorVariant="onBrand"
                        >
                            {t('timeMapping', { duration: formatDuration(durationMs) })}
                        </Text>
                    </Row>
                )}
            </Row>
        </Surface>
    );
}

export default AnswerSummaryCard;
