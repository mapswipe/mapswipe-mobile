import React, {
    useCallback,
    useMemo,
    useState,
} from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { query } from 'firebase/database';

import ClickableListItem from '@/components/ClickableListItems';
import Page from '@/components/Page';
import PageHeader from '@/components/PageHeader';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';
import useFirebaseDatabaseList from '@/hooks/useFirebaseDatabaseList';
import { rankedSearchOnList } from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';

const styles = StyleSheet.create({
    hintText: {
        textAlign: 'center',
        opacity: 0.5,
        marginTop: 20,
    },
});

export interface UserGroupWithKey {
    key: string;
    name?: string;
    archivedAt?: string;
    archivedBy?: string;
    [key: string]: unknown;
}

function ExploreGroups() {
    const [searchText, setSearchText] = useState<string>('');
    const router = useRouter();
    const userGroupsQuery = useMemo(() => (
        query(
            firebaseRef('/v2/userGroups/'),
        )
    ), []);

    const { list, pending } = useFirebaseDatabaseList<UserGroupWithKey>({
        query: userGroupsQuery,
    });

    const nonArchivedUserGroups = list.filter(
        (ug) => !ug.archivedAt && !ug.archivedBy,
    );

    const filteredGroups = useMemo(() => {
        if (searchText.length < 3) {
            return [];
        }

        return rankedSearchOnList(
            nonArchivedUserGroups,
            searchText,
            (group) => group.name ?? '',
        );
    }, [searchText, nonArchivedUserGroups]);

    const onHandleItemClick = useCallback((key?: string) => {
        router.push(`exploreGroup/${key}`);
    }, [router]);

    return (
        <Page
            title="Explore Group"
            isScrollable={false}
        >
            <PageHeader heading="Explore Group" />
            {pending && <ActivityIndicator size="large" />}

            <TextInput
                placeholder="Enter search Text"
                variant="normal"
                value={searchText}
                onChangeText={setSearchText}
            />

            {searchText.length < 3 && (
                <Text style={styles.hintText}>
                    Start typing group name to begin the search! At least 3 characters
                </Text>
            )}

            {searchText.length >= 3 && (
                <ScrollView>
                    {filteredGroups.length > 0 ? (
                        filteredGroups.map((group) => (
                            <ClickableListItem
                                key={group.key}
                                name={group.key}
                                title={group.name ?? ''}
                                onPress={onHandleItemClick}
                            />
                        ))
                    ) : (
                        <Text style={styles.hintText}>
                            There are no groups matching your search text!
                        </Text>
                    )}
                </ScrollView>
            )}
        </Page>
    );
}

export default ExploreGroups;
