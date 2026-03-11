import React, {
    useCallback,
    useMemo,
} from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router/build/hooks';
import { query } from 'firebase/database';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import ClickableListItem from '@/components/ClickableListItems';
import HeatMap from '@/components/HeatMap';
import Icon from '@/components/Icon';
import InfoCard from '@/components/InfoCard';
import InlineListView from '@/components/InlineListView';
import Page from '@/components/Page';
import PageHeader from '@/components/PageHeader';
import Text from '@/components/Text';
import { publicDashboardUrl } from '@/constants/common';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseRef } from '@/utils/firebase';

interface userGroup {
    createdAt: number;
    createdBy: string;
    description: string;
    name: string;
    nameKey: string;
}

const createStyles = () => StyleSheet.create({
    infoCardContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 10,
    },
    infoCard: {
        width: '48%',
        marginBottom: 12,
    },
});

function ExploreGroup() {
    const { id: userGroupId } = useLocalSearchParams<{ id: string }>();
    const styles = useThemedStyles(createStyles);
    const theme = useTheme();

    const userGroupsQuery = useMemo(() => (
        query(
            firebaseRef(`/v2/userGroups/${userGroupId}/`),
        )
    ), [userGroupId]);

    const { data: userGroupData, pending } = useFirebaseDatabase<userGroup>({
        query: userGroupsQuery,
    });

    const data = Array.from({ length: 6 }).map((_, i) => ({
        id: i.toString(),
        title: `Card ${i + 1}`,
        value: `Card ${i + 1}`,
        unit: 'hr',
    }));

    const handleMoreStatsClick = useCallback(() => {
        if (userGroupId) {
            Linking.openURL(`${publicDashboardUrl}/user-group/${userGroupId}/`);
        }
    }, [userGroupId]);

    const isUserMember = true;

    return (
        <Page title="Explore Group" isScrollable={false}>
            <PageHeader heading={userGroupData?.name ?? ''} />
            {isUserMember && (
                <InlineListView
                    withPadding
                    spacing="2xs"
                >

                    <Button name="Join" title="Join" colorVariant="success" />
                </InlineListView>
            )}
            <ScrollView>
                <BlockListView
                    withPadding
                    spacing="xs"
                >
                    <Text variant="label">
                        All the stats are only updated once a day
                    </Text>
                    <View style={styles.infoCardContainer}>
                        {data.map((item) => (
                            <InfoCard
                                key={item.id}
                                title={item.title}
                                value={item.value}
                                unit={item.unit}
                                style={styles.infoCard}
                            />
                        ))}
                    </View>
                </BlockListView>
                <BlockListView
                    withPadding
                    spacing="xs"
                >
                    <Text variant="title">
                        Contribution Heatmap (Last 30 days)
                    </Text>
                    <HeatMap />
                    <ClickableListItem
                        title="More Stats"
                        onPress={handleMoreStatsClick}
                        after={(
                            <Icon
                                name="sign-out"
                                size={18}
                                color={theme.info}
                            />
                        )}
                    />
                </BlockListView>
                {isUserMember && (
                    <BlockListView
                        withPadding
                        spacing="xs"
                    >
                        <Text variant="title">
                            Settings
                        </Text>
                        <ClickableListItem
                            title="Leave Group"
                            accessibilityLabel="Leave Group"
                            onPress={handleMoreStatsClick}
                        />
                    </BlockListView>
                )}
            </ScrollView>
        </Page>
    );
}

export default ExploreGroup;
