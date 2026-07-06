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
    const [error, setError] = React.useState<Error>();

    React.useEffect(() => {
        if (skip || isNotDefined(query)) {
            return undefined;
        }

        setPending(true);
        setError(undefined);
        const handleQueryDone = (snapshot: DataSnapshot) => {
            setPending(false);
            setError(undefined);

            if (!snapshot.exists()) {
                setData(undefined);
                return;
            }

            setData(snapshot.val());
        };

        const handleQueryError = (queryError: Error) => {
            // eslint-disable-next-line no-console
            console.error(queryError);
            setPending(false);
            setError(queryError);
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
        error,
    }), [data, pending, error]);

    return returnValue;
}

export default useFirebaseDatabase;
