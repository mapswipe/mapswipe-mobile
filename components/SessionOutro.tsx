import {
    useCallback,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { type LayoutChangeEvent } from 'react-native';

import AnswerSummaryCard from '@/components/domain/AnswerSummaryCard';
import Badge from '@/components/ui/Badge';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import { type ButtonStateType } from '@/components/ui/ButtonLayout';
import Icon from '@/components/ui/Icon';
import ListView from '@/components/ui/ListView';
import Row from '@/components/ui/Row';
import Spacer from '@/components/ui/Spacer';
import Spinner from '@/components/ui/Spinner';
import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import { type AnswerCount } from '@/utils/results';

export type ResultSyncStatus = 'not-started' | 'in-progress' | 'failed' | 'successful';

// Rowless on purpose: the outro is one block, carried as the list header just to get a scroller.
const NO_ROWS: readonly never[] = [];

function selectNoKey(): string {
    return '';
}

function renderNoRow(): null {
    return null;
}

interface Props {
    resultSyncStatus: ResultSyncStatus;
    onContinueMapping: () => void;
    onCompleteSession: () => void;
    onGoBack?: () => void;
    onDiscardSession: () => void;
    swipeBackHint?: boolean;
    answerCounts?: AnswerCount[];
    reviewedCount?: number;
    durationMs?: number;
}

function SessionOutro(props: Props) {
    const {
        resultSyncStatus,
        onContinueMapping,
        onCompleteSession,
        onGoBack,
        onDiscardSession,
        swipeBackHint = false,
        answerCounts,
        reviewedCount,
        durationMs,
    } = props;
    const { t } = useTranslation('mappingSession');

    // Measured so the content is held to a screenful and the spacer can push the buttons down.
    const [viewportHeight, setViewportHeight] = useState(0);

    const handleViewportLayout = useCallback((event: LayoutChangeEvent) => {
        setViewportHeight(event.nativeEvent.layout.height);
    }, []);

    const inProgress = resultSyncStatus === 'in-progress';
    const failed = resultSyncStatus === 'failed';
    const succeeded = resultSyncStatus === 'successful';

    const buttonState: ButtonStateType = inProgress ? 'disabled' : 'default';

    // Show every answer option, including those with a count of 0.
    const visibleAnswers = answerCounts ?? [];

    const content = (
        <Box minHeight={viewportHeight}>
            <Stack
                spacing="lg"
                padding="md"
                grow="fill"
            >
                {/* The medallion is a fixed-size box, so the column's stretch cannot centre it. */}
                <Box align="center">
                    <Badge
                        shape="circle"
                        sizeVariant="3xl"
                        colorVariant="positive"
                        styleVariant="filled"
                        iconName="checkmark-outline"
                    />
                </Box>

                <Stack
                    spacing="3xs"
                    align="center"
                >
                    <Text
                        variant="heading"
                        colorVariant="onBrand"
                        align="center"
                    >
                        {t('sessionCompleteTitle')}
                    </Text>
                    <Text
                        variant="description"
                        colorVariant="onBrand"
                        align="center"
                    >
                        {swipeBackHint ? t('swipeBackToRevise') : t('sessionCompleteMessage')}
                    </Text>
                </Stack>

                <AnswerSummaryCard
                    answerCounts={visibleAnswers}
                    reviewedCount={reviewedCount}
                    durationMs={durationMs}
                />

                {inProgress && (
                    <Row
                        spacing="2xs"
                        justify="center"
                    >
                        {/* Unlabelled on purpose: the text beside it would be announced twice. */}
                        <Spinner
                            sizeVariant="sm"
                            colorVariant="onBrand"
                        />
                        <Text
                            variant="description"
                            colorVariant="onBrand"
                        >
                            {t('savingProgress')}
                        </Text>
                    </Row>
                )}
                {failed && (
                    <Row
                        spacing="2xs"
                        justify="center"
                    >
                        <Icon
                            name="warning-outline"
                            sizeVariant="xl"
                            colorVariant="negative"
                        />
                        <Text
                            variant="description"
                            colorVariant="onBrand"
                        >
                            {t('saveFailed')}
                        </Text>
                    </Row>
                )}
                {succeeded && (
                    <Row
                        spacing="2xs"
                        justify="center"
                    >
                        <Icon
                            name="checkmark-outline"
                            sizeVariant="xl"
                            colorVariant="positive"
                        />
                        <Text
                            variant="description"
                            colorVariant="onBrand"
                        >
                            {t('saveSucceeded')}
                        </Text>
                    </Row>
                )}

                <Spacer
                    size="md"
                    grow
                />

                <Stack spacing="sm">
                    <Button
                        accessibilityLabel={t('continueMapping')}
                        colorVariant="positive"
                        styleVariant="filled"
                        state={buttonState}
                        onPress={onContinueMapping}
                    >
                        <Stack
                            spacing="none"
                            align="center"
                        >
                            <Text
                                weight="bold"
                                colorVariant="onBrand"
                                align="center"
                            >
                                {t('continueMapping')}
                            </Text>
                            <Text
                                variant="label"
                                weight="regular"
                                colorVariant="onBrand"
                                align="center"
                            >
                                {t('startNewTasks')}
                            </Text>
                        </Stack>
                    </Button>
                    <Button
                        accessibilityLabel={t('saveAndFinish')}
                        title={t('saveAndFinish')}
                        colorVariant="onBrand"
                        styleVariant="outline"
                        state={buttonState}
                        onPress={onCompleteSession}
                    />
                    {onGoBack && (
                        <Button
                            accessibilityLabel={t('goBack')}
                            title={t('goBack')}
                            colorVariant="onBrand"
                            styleVariant="outline"
                            state={buttonState}
                            onPress={onGoBack}
                        />
                    )}
                    {/* `negative`, not `accent`: a different red, reserved for errors. */}
                    <Button
                        accessibilityLabel={t('discardSession')}
                        title={t('discardSession')}
                        colorVariant="negative"
                        styleVariant="transparent"
                        state={buttonState}
                        onPress={onDiscardSession}
                    />
                </Stack>
            </Stack>
        </Box>
    );

    return (
        <ListView
            data={NO_ROWS}
            keySelector={selectNoKey}
            renderItem={renderNoRow}
            spacing="none"
            grow="fill"
            header={content}
            onLayout={handleViewportLayout}
        />
    );
}

export default SessionOutro;
