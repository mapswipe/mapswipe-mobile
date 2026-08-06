import {
    useEffect,
    useMemo,
    useState,
} from 'react';
import {
    onValue,
    Query,
} from 'firebase/database';

import { FbUserGroup } from '@/firebaseGenerated/extended_models';
import { firebaseRef } from '@/utils/firebase';

import useFirebaseDatabaseList from './useFirebaseDatabaseList';

export interface UserGroupWithGroupId extends FbUserGroup {
    groupId: string;
}

// Firebase stores the group keys apart from the group data, so this needs two reads.
function useUserGroups(userId: string | undefined) {
    const userGroupsQuery = useMemo(
        () => (userId ? firebaseRef(`v2/users/${userId}/userGroups/`) : undefined),
        [userId],
    );

    const { list: userGroupRefs, pending: loadingGroupKeys } = useFirebaseDatabaseList({
        query: userGroupsQuery as Query,
        skip: !userId,
    });

    const groupKeys = useMemo(
        () => userGroupRefs.map((item) => item.key),
        [userGroupRefs],
    );

    const [userGroups, setUserGroups] = useState<UserGroupWithGroupId[]>([]);
    const [loadingGroupData, setLoadingGroupData] = useState(true);

    useEffect(() => {
        if (groupKeys.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUserGroups([]);
            setLoadingGroupData(false);
            return;
        }

        const unsubscribes = groupKeys.map((key) => {
            const groupRef = firebaseRef(`v2/userGroups/${key}`);

            return onValue(groupRef, (snapshot) => {
                const groupData = snapshot.val() as FbUserGroup;
                if (!snapshot.exists()) {
                    setUserGroups((prev) => prev.filter((group) => group.groupId !== key));
                    setLoadingGroupData(false);
                    return;
                }
                if (!groupData.name) return;

                setUserGroups((prev) => [
                    ...prev.filter((group) => group.groupId !== key),
                    { groupId: key, ...groupData },
                ]);

                setLoadingGroupData(false);
            });
        });
        // eslint-disable-next-line consistent-return
        return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }, [groupKeys]);

    return {
        userGroups,
        pending: loadingGroupKeys || loadingGroupData,
    };
}

export default useUserGroups;
