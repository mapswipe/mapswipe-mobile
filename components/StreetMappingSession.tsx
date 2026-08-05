import { useMemo } from 'react';

import Stack from '@/components/ui/Stack';
import Text from '@/components/ui/Text';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import { StreetProject } from '@/utils/types';

interface Props {
    taskGroupId: string;
    projectDetails: StreetProject;
}

function StreetMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
    } = props;

    const taskQuery = useMemo(() => (
        firebaseRef(`v2/tasks/${projectDetails.projectId}/${taskGroupId}`)
    ), [projectDetails.projectId, taskGroupId]);

    // Tasks are fetched but nothing consumes them yet: the session UI is still a placeholder.
    useFirebaseDatabase<string>({
        query: taskQuery,
    });

    return (
        <Stack spacing="none">
            <Text>
                Not implemented yet!
            </Text>
        </Stack>
    );
}

export default StreetMappingSession;
