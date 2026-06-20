import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';
import { isDefined } from '@togglecorp/fujs';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import InlineListView from '@/components/InlineListView';
import Text from '@/components/Text';
import {
    FONT_SIZE_2XL,
    FONT_SIZE_MD,
    FONT_SIZE_SM,
    SPACING_2XS,
    SPACING_3XS,
    SPACING_4XS,
    SPACING_MD,
    SPACING_SM,
    SPACING_XS,
} from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useTheme from '@/hooks/useTheme';
import { type AnswerCount } from '@/utils/results';

export type ResultSyncStatus = 'not-started' | 'in-progress' | 'failed' | 'successful';

// Result option colors are stored as named CSS colors ('green'/'red'/...) for
// the tile projects, or as hex for custom options. Map them to theme tokens so
// the summary matches the rest of the app (and 'transparent' reads as muted).
function getDisplayColor(color: string, theme: AppTheme): string {
    switch (color) {
        case 'green': return theme.success;
        case 'yellow': return theme.warning;
        case 'red': return theme.error;
        case 'transparent': return theme.textMuted;
        default: return color;
    }
}

function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.round(ms / 1000));
    if (totalSeconds < 60) {
        return `${totalSeconds} sec`;
    }
    return `${Math.round(totalSeconds / 60)} min`;
}

// The container is flex:1 so the action buttons can be pushed to the bottom via
// the spacer. The footer wrapper gives it an explicit (measured) height, which
// is what makes flex:1 safe here — an unresolved height would collapse it.
const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        padding: SPACING_MD,
        alignItems: 'center',
    },
    // Pushes the action buttons to the bottom, leaving a gap above them.
    spacer: {
        flex: 1,
        minHeight: SPACING_MD,
    },
    centerText: {
        textAlign: 'center',
    },
    glow: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(50, 169, 41, 0.18)',
    },
    checkCircle: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#32A929',
    },
    headerBlock: {
        alignItems: 'center',
    },
    card: {
        width: '100%',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingVertical: SPACING_SM,
        paddingHorizontal: SPACING_XS,
    },
    // Answers are full-width rows (label + count on one line) separated by
    // divider lines, so they fill the width and read clearly.
    statsList: {
        width: '100%',
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING_2XS,
        paddingVertical: SPACING_4XS,
    },
    statRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING_3XS,
        flexShrink: 1,
    },
    statCount: {
        fontSize: FONT_SIZE_2XL,
        fontWeight: 'bold',
        includeFontPadding: false,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    horizontalDivider: {
        height: StyleSheet.hairlineWidth,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginVertical: SPACING_XS,
    },
    cardFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    buttonGroup: {
        width: '100%',
    },
    continueContent: {
        alignItems: 'center',
    },
    continueTitle: {
        color: '#FFFFFF',
        fontSize: FONT_SIZE_MD,
        fontWeight: 'bold',
        textAlign: 'center',
        includeFontPadding: false,
    },
    continueSubtitle: {
        color: 'rgba(255, 255, 255, 0.85)',
        fontSize: FONT_SIZE_SM,
        textAlign: 'center',
        includeFontPadding: false,
        marginTop: 2,
    },
});

interface Props {
    resultSyncStatus: ResultSyncStatus;
    onContinueMapping: () => void;
    onCompleteSession: () => void;
    onGoBack?: () => void;
    onDiscardSession: () => void;
    // When the outro is reachable as a page the user can swipe back from, we
    // hide the redundant "Go back" button and show a swipe-back hint instead.
    swipeBackHint?: boolean;
    // Session summary: per-answer counts, total tiles reviewed, and the time
    // spent mapping (ms). All optional so the outro still renders without them.
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
    const theme = useTheme();

    const inProgress = resultSyncStatus === 'in-progress';
    const failed = resultSyncStatus === 'failed';
    const succeeded = resultSyncStatus === 'successful';

    // Show every answer option, including those with a count of 0.
    const visibleAnswers = answerCounts ?? [];
    const showCard = visibleAnswers.length > 0
        || isDefined(durationMs)
        || (isDefined(reviewedCount) && reviewedCount > 0);

    return (
        <BlockListView
            style={styles.container}
            spacing="lg"
        >
            <View style={styles.glow}>
                <View style={styles.checkCircle}>
                    <Icon
                        name="checkmark-outline"
                        color={theme.textOnPrimary}
                        size={32}
                    />
                </View>
            </View>

            <BlockListView style={styles.headerBlock} spacing="3xs">
                <Text variant="heading" colorVariant="brand" style={styles.centerText}>
                    {t('sessionCompleteTitle')}
                </Text>
                <Text
                    colorVariant="brand"
                    variant="description"
                    style={styles.centerText}
                >
                    {swipeBackHint ? t('swipeBackToRevise') : t('sessionCompleteMessage')}
                </Text>
            </BlockListView>

            {showCard && (
                <View style={styles.card}>
                    {visibleAnswers.length > 0 && (
                        <View style={styles.statsList}>
                            {visibleAnswers.map((answer) => (
                                <View
                                    key={answer.value}
                                    style={styles.statRow}
                                >
                                    <View style={styles.statRowLeft}>
                                        <View
                                            // eslint-disable-next-line react-native/no-inline-styles
                                            style={[styles.dot, {
                                                backgroundColor: getDisplayColor(answer.color, theme),
                                            }]}
                                        />
                                        <Text variant="description" colorVariant="brand">
                                            {answer.label}
                                        </Text>
                                    </View>
                                    <Text
                                        style={StyleSheet.flatten([styles.statCount, {
                                            color: getDisplayColor(answer.color, theme),
                                        }])}
                                    >
                                        {String(answer.count)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                    {visibleAnswers.length > 0 && <View style={styles.horizontalDivider} />}
                    <View style={styles.cardFooterRow}>
                        {isDefined(reviewedCount) && (
                            <Text variant="label" colorVariant="brand">
                                {t('tilesReviewed', { count: reviewedCount })}
                            </Text>
                        )}
                        {isDefined(durationMs) && (
                            <View style={styles.footerItem}>
                                <Icon
                                    name="time-outline"
                                    color={theme.textOnBrand}
                                    size={14}
                                />
                                <Text variant="label" colorVariant="brand">
                                    {t('timeMapping', { duration: formatDuration(durationMs) })}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {inProgress && (
                <InlineListView withCenteredContent withoutWrap spacing="2xs">
                    <ActivityIndicator size="small" color={theme.textOnBrand} />
                    <Text colorVariant="brand" variant="description">
                        {t('savingProgress')}
                    </Text>
                </InlineListView>
            )}
            {failed && (
                <InlineListView withCenteredContent withoutWrap spacing="2xs">
                    <Icon name="warning-outline" color={theme.error} size={20} />
                    <Text colorVariant="brand" variant="description">
                        {t('saveFailed')}
                    </Text>
                </InlineListView>
            )}
            {succeeded && (
                <InlineListView withCenteredContent withoutWrap spacing="2xs">
                    <Icon name="checkmark-outline" color={theme.success} size={20} />
                    <Text colorVariant="brand" variant="description">
                        {t('saveSucceeded')}
                    </Text>
                </InlineListView>
            )}

            <View style={styles.spacer} />

            {/* Order matches the design: the prominent Continue first, then
                Save & finish, then the de-emphasized Discard last. */}
            <BlockListView style={styles.buttonGroup} spacing="sm">
                <Button
                    name="continue"
                    colorVariant="primaryGreen"
                    styleVariant="filled"
                    disabled={inProgress}
                    onPress={onContinueMapping}
                >
                    <View style={styles.continueContent}>
                        <Text style={styles.continueTitle}>
                            {t('continueMapping')}
                        </Text>
                        <Text style={styles.continueSubtitle}>
                            {t('startNewTasks')}
                        </Text>
                    </View>
                </Button>
                <Button
                    name="complete"
                    title={t('saveAndFinish')}
                    colorVariant="white"
                    styleVariant="outline"
                    disabled={inProgress}
                    onPress={onCompleteSession}
                />
                {onGoBack && (
                    <Button
                        name="go-back"
                        title={t('goBack')}
                        colorVariant="white"
                        styleVariant="outline"
                        disabled={inProgress}
                        onPress={onGoBack}
                    />
                )}
                <Button
                    name="discard"
                    title={t('discardSession')}
                    colorVariant="primaryRed"
                    styleVariant="transparent"
                    disabled={inProgress}
                    onPress={onDiscardSession}
                />
            </BlockListView>
        </BlockListView>
    );
}

export default SessionOutro;
