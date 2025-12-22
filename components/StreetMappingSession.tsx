import { useMemo, useState } from "react";
import { firebaseRef } from "@/utils/firebase";
import { StreetProject } from "@/utils/types";
import BlockListView from "@/components/BlockListView";
import Text from "@/components/Text";
import useFirebaseDatabase from "@/hooks/useFirebaseDatabase";

interface Props {
    taskGroupId: string;
    projectDetails: StreetProject;
}

function StreetMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);

    const taskQuery = useMemo(() => (
        firebaseRef(`v2/tasks/${projectDetails.projectId}/${taskGroupId}`)
    ), [projectDetails.projectId, taskGroupId]);

    const { data: compressedTasks } = useFirebaseDatabase<string>({
        query: taskQuery,
    });

    console.info(compressedTasks);

    return (
        <BlockListView>
            <Text>
                Not implemented yet!
            </Text>
        </BlockListView>
    );
}

export default StreetMappingSession;
