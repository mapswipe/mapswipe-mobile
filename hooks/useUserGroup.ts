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

interface Props {
    userId: string | undefined;
}

function useUserGroups({ userId }: Props) {
    // Step 1: Get the list of group keys the user belongs to
    const userGroupsQuery = useMemo(() => {
        if (!userId) return undefined;
        return firebaseRef(`v2/users/${userId}/userGroups/`);
    }, [userId]);

    const { list: userGroupRefs, pending: refsPending } = useFirebaseDatabaseList({
        query: userGroupsQuery as Query,
        skip: !userId,
    });

    const groupKeys = useMemo(
        () => userGroupRefs.map((item) => item.key),
        [userGroupRefs],
    );

    // Step 2: Manually fetch group details (hooks can't run in a loop,
    // so we use a useEffect for the secondary fan-out fetch)
    const [userGroups, setUserGroups] = useState<UserGroupWithGroupId[]>([]);
    const [groupsPending, setGroupsPending] = useState(false);

    useEffect(() => {
        if (groupKeys.length === 0) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setUserGroups([]);
            return;
        }

        setGroupsPending(true);

        const unsubscribes = groupKeys.map((key) => {
            const groupRef = firebaseRef(`v2/userGroups/${key}`);

            return onValue(groupRef, (snapshot) => {
                if (!snapshot.exists()) return;

                const groupData = snapshot.val() as FbUserGroup;
                if (!groupData.name) return;

                setUserGroups((prev) => {
                    // Replace or insert this group in the list
                    const withoutThis = prev.filter((g) => g.groupId !== key);
                    return [...withoutThis, { groupId: key, ...groupData }];
                });

                setGroupsPending(false);
            });
        });

        // eslint-disable-next-line consistent-return
        return () => {
            unsubscribes.forEach((unsub) => unsub());
        };
    }, [groupKeys]);

    const pending = refsPending || groupsPending;

    return { userGroups, pending };
}

export default useUserGroups;
