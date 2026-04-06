import React, {
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { query } from 'firebase/database';

import Button from '@/components/Button';
import Page from '@/components/Page';
import Text from '@/components/Text';
import TextInput from '@/components/TextInput';
import { FbUserGroup } from '@/firebaseGenerated/extended_models';
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

export interface UserGroupWithKey extends FbUserGroup {
    [key: string]: unknown;
}

function ExploreGroups() {
    const [searchText, setSearchText] = useState<string>('');
    const router = useRouter();
    const { t } = useTranslation('profileScreen');
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
            title={t('exploreGroups')}
            scrollable={false}
            showBackButton
        >
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
                            <Button
                                key={group.nameKey}
                                name={group.key}
                                title={group.name ?? ''}
                                onPress={onHandleItemClick}
                                styleVariant="block"
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
