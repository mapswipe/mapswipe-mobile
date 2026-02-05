import React from 'react';
import { isNotDefined } from '@togglecorp/fujs';
import {
    DataSnapshot,
    onValue,
    Query,
} from 'firebase/database';

interface Props {
    query: Query | undefined;
    skip?: boolean;
}

function useFirebaseDatabase<DATA = unknown>(props: Props) {
    const {
        query,
        skip = false,
    } = props;

    const [pending, setPending] = React.useState(!skip);
    const [data, setData] = React.useState<DATA>();

    React.useEffect(() => {
        if (skip || isNotDefined(query)) {
            return undefined;
        }

        setPending(true);
        const handleQueryDone = (snapshot: DataSnapshot) => {
            setPending(false);

            if (!snapshot.exists()) {
                setData(undefined);
                return;
            }

            setData(snapshot.val());
        };

        const handleQueryError = (error: unknown) => {
            // eslint-disable-next-line no-console
            console.error(error);
            setPending(false);
        };

        const unsubscribe = onValue(query, handleQueryDone, handleQueryError);

        return () => {
            setPending(false);
            unsubscribe();
        };
    }, [query, skip]);

    const returnValue = React.useMemo(() => ({
        data,
        pending,
    }), [data, pending]);

    return returnValue;
}

export default useFirebaseDatabase;
