import { AppFeatureEnum } from '@/generated/types/graphql';
import {
    type FbProject,
    PROJECT_TYPE_COMPLETENESS,
} from '@/utils/types';

// Features required to open the project.
// NOTE: Projects pushed before `requiredFeatures` was added don't have it,
// so it is derived for them.
export function getProjectRequiredFeatures(project: FbProject | undefined): string[] {
    if (!project) {
        return [];
    }
    if (project.requiredFeatures) {
        return project.requiredFeatures;
    }
    if (
        project.projectType === PROJECT_TYPE_COMPLETENESS
        && project.overlayTileServer?.type === 'vector'
    ) {
        return [AppFeatureEnum.ProjectCompletenessVectorLayer];
    }
    return [];
}

// Required features that are not supported.
// NOTE: Features unknown to this version of the app are not supported.
export function getMissingFeatures(
    requiredFeatures: string[],
    supportedFeatures: string[],
): string[] {
    return requiredFeatures.filter((feature) => !supportedFeatures.includes(feature));
}
