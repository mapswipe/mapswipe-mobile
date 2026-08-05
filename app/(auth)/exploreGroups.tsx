import {
    useCallback,
    useMemo,
    useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { query } from 'firebase/database';

import ListRow from '@/components/ui/ListRow';
import ListView from '@/components/ui/ListView';
import Screen from '@/components/ui/Screen';
import TextInput from '@/components/ui/TextInput';
import { FbUserGroup } from '@/firebaseGenerated/extended_models';
import useFirebaseDatabaseList from '@/hooks/useFirebaseDatabaseList';
import { rankedSearchOnList } from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';

const BACK_LABEL = 'Back';

const MIN_SEARCH_LENGTH = 3;

const SEARCH_PLACEHOLDER = 'Enter search Text';

const SEARCH_HINT = 'Start typing group name to begin the search! At least 3 characters';
const NO_MATCH_MESSAGE = 'There are no groups matching your search text!';

export interface UserGroupWithKey extends FbUserGroup {
    [key: string]: unknown;
}

// Restates `key` as a string: the index signature above would otherwise type it `unknown`.
type UserGroupItem = UserGroupWithKey & { key: string };

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
        if (searchText.length < MIN_SEARCH_LENGTH) {
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

    const groupKeySelector = useCallback(
        (group: UserGroupItem) => group.nameKey,
        [],
    );

    const renderGroup = useCallback(
        (group: UserGroupItem) => (
            <ListRow
                name={group.key}
                title={group.name ?? ''}
                accessibilityLabel={group.name ?? ''}
                onPress={onHandleItemClick}
            />
        ),
        [onHandleItemClick],
    );

    const emptyMessage = searchText.length < MIN_SEARCH_LENGTH
        ? SEARCH_HINT
        : NO_MATCH_MESSAGE;

    return (
        <Screen
            title={t('exploreGroups')}
            withHeader
            backAccessibilityLabel={BACK_LABEL}
            safeArea="bottom"
            layout="fill"
        >
            <TextInput
                contentVariant="search"
                colorVariant="sunken"
                placeholder={SEARCH_PLACEHOLDER}
                accessibilityLabel={SEARCH_PLACEHOLDER}
                value={searchText}
                onChangeText={setSearchText}
            />
            <ListView
                data={filteredGroups}
                keySelector={groupKeySelector}
                renderItem={renderGroup}
                spacing="none"
                grow="slot"
                pending={pending}
                emptyMessage={emptyMessage}
            />
        </Screen>
    );
}

export default ExploreGroups;
