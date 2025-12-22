import { type Query } from 'firebase/database';
import useFirebaseDatabase from './useFirebaseDatabase';
import { isNotDefined } from '@togglecorp/fujs';
import { useMemo } from 'react';

interface Props {
    query: Query;
    skip?: boolean;
}

function useFirebaseDatabaseList<LIST_ITEM extends object>(props: Props) {
    const { data, pending } = useFirebaseDatabase(props);

    const list = useMemo(() => {
        if (isNotDefined(data)) {
            return [];
        }

        return Object.values(data) as LIST_ITEM[];
    }, [data]);

    return { list, pending };
}

export default useFirebaseDatabaseList;
