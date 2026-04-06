import {
    useMemo,
    useState,
} from 'react';
import { useLocalSearchParams } from 'expo-router';

import CompareMappingSession from '@/components/CompareMappingSession';
import Page from '@/components/Page';
import StreetMappingSession from '@/components/StreetMappingSession';
import TileGridMappingSession from '@/components/TileGridMappingSession';
import ValidateImageMappingSession from '@/components/ValidateImageMappingSession';
import ValidateMappingSession from '@/components/ValidateMappingSession';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import {
    FbProject,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_STREET,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
    Results,
} from '@/utils/types';

function MapTaskGroup() {
    const {
        id: projectId,
        taskGroupId,
    } = useLocalSearchParams<{id: string; taskGroupId: string;}>();

    const projectQuery = useMemo(
        () => firebaseRef(`v2/projects/${projectId}`),
        [projectId],
    );

    const { data: projectDetails } = useFirebaseDatabase<FbProject>({
        query: projectQuery,
    });
    const [results, setResults] = useState<Results>({});

    return (
        <Page
            title={projectDetails?.projectInstruction ?? 'Map Project'}
            variant="brand"
            scrollable={false}
            showBackButton
            headerTitleAlign="center"
        >
            {projectDetails?.projectType === PROJECT_TYPE_FIND && (
                <TileGridMappingSession
                    taskGroupId={taskGroupId}
                    projectDetails={projectDetails}
                    results={results}
                    onResultsChange={setResults}
                />
            )}
            {projectDetails?.projectType === PROJECT_TYPE_COMPARE && (
                <CompareMappingSession
                    taskGroupId={taskGroupId}
                    projectDetails={projectDetails}
                    results={results}
                    onResultsChange={setResults}
                />
            )}
            {projectDetails?.projectType === PROJECT_TYPE_VALIDATE && (
                <ValidateMappingSession
                    taskGroupId={taskGroupId}
                    projectDetails={projectDetails}
                    results={results}
                    onResultsChange={setResults}
                />
            )}
            {projectDetails?.projectType === PROJECT_TYPE_COMPLETENESS && (
                <TileGridMappingSession
                    taskGroupId={taskGroupId}
                    projectDetails={projectDetails}
                    results={results}
                    onResultsChange={setResults}
                />
            )}
            {projectDetails?.projectType === PROJECT_TYPE_VALIDATE_IMAGE && (
                <ValidateImageMappingSession
                    taskGroupId={taskGroupId}
                    projectDetails={projectDetails}
                    results={results}
                    onResultsChange={setResults}
                />
            )}
            {projectDetails?.projectType === PROJECT_TYPE_STREET && (
                <StreetMappingSession
                    taskGroupId={taskGroupId}
                    projectDetails={projectDetails}
                />
            )}
        </Page>
    );
}

export default MapTaskGroup;
