import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Icon from '@/components/Icon';
import InlineListView from '@/components/InlineListView';
import Text from '@/components/Text';
import { SPACING_MD } from '@/constants/dimensions';
import useTheme from '@/hooks/useTheme';

export type ResultSyncStatus = 'not-started' | 'in-progress' | 'failed' | 'successful';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: SPACING_MD,
        justifyContent: 'center',
    },
});

interface Props {
    resultSyncStatus: ResultSyncStatus;
    onContinueMapping: () => void;
    onCompleteSession: () => void;
    onGoBack: () => void;
    onDiscardSession: () => void;
}

function SessionOutro(props: Props) {
    const {
        resultSyncStatus,
        onContinueMapping,
        onCompleteSession,
        onGoBack,
        onDiscardSession,
    } = props;
    const { t } = useTranslation('mappingSession');
    const theme = useTheme();

    const inProgress = resultSyncStatus === 'in-progress';
    const failed = resultSyncStatus === 'failed';
    const succeeded = resultSyncStatus === 'successful';

    return (
        <BlockListView
            style={styles.container}
            spacing="xl"
        >
            <BlockListView>
                <Text variant="heading" colorVariant="brand">
                    {t('sessionCompleteTitle')}
                </Text>
                <Text
                    colorVariant="brand"
                    variant="description"
                >
                    {t('sessionCompleteMessage')}
                </Text>
            </BlockListView>
            {inProgress && (
                <View>
                    <InlineListView
                        withCenteredContent
                        withoutWrap
                        withPadding
                    >
                        <ActivityIndicator size="small" color={theme.textOnBrand} />
                        <Text
                            colorVariant="brand"
                            variant="description"
                        >
                            {t('savingProgress')}
                        </Text>
                    </InlineListView>
                </View>
            )}
            {failed && (
                <InlineListView
                    withoutWrap
                    spacing="2xs"
                >
                    <Icon name="warning-outline" color={theme.error} size={20} />
                    <Text
                        colorVariant="brand"
                        variant="description"
                    >
                        {t('saveFailed')}
                    </Text>
                </InlineListView>
            )}
            {succeeded && (
                <InlineListView
                    withoutWrap
                    spacing="2xs"
                >
                    <Icon name="checkmark-outline" color={theme.success} size={20} />
                    <Text
                        colorVariant="brand"
                        variant="description"
                    >
                        {t('saveSucceeded')}
                    </Text>
                </InlineListView>
            )}
            <BlockListView spacing="2xs">
                <Button
                    name="continue"
                    title={t('continueMapping')}
                    colorVariant="primaryGreen"
                    styleVariant="filled"
                    disabled={inProgress}
                    onPress={onContinueMapping}
                />
                <Text variant="label">
                    {t('continueMappingHelp')}
                </Text>
            </BlockListView>

            <BlockListView spacing="2xs">
                <Button
                    name="complete"
                    title={t('completeSession')}
                    colorVariant="white"
                    styleVariant="outline"
                    disabled={inProgress}
                    onPress={onCompleteSession}
                />
                <Text variant="label">
                    {t('completeSessionHelp')}
                </Text>
            </BlockListView>

            <BlockListView spacing="2xs">
                <Button
                    name="go-back"
                    title={t('goBack')}
                    colorVariant="white"
                    styleVariant="outline"
                    disabled={inProgress}
                    onPress={onGoBack}
                />
                <Text variant="label">
                    {t('goBackHelp')}
                </Text>
            </BlockListView>

            <BlockListView spacing="2xs">
                <Button
                    name="discard"
                    title={t('discardSession')}
                    colorVariant="danger"
                    styleVariant="outline"
                    disabled={inProgress}
                    onPress={onDiscardSession}
                />
                <Text variant="label">
                    {t('discardSessionHelp')}
                </Text>
            </BlockListView>
        </BlockListView>
    );
}

export default SessionOutro;
