import type { Timestamp } from 'firebase/firestore';

/** Represents app announcements for the contributors. */
export interface FbAnnouncement {
    url: string;
    text: string;
}

/** Represents the requesting organisation. */
export interface FbOrganisation {
    name: string;
    description?: string;
    nameKey: string;
    abbreviation?: string;
    isArchived: boolean;
}

/** Represents project status */
export type FbEnumProjectStatus =
    | 'active'
    | 'inactive'
    | 'private_inactive'
    | 'private_active'
    | 'finished'
    | 'private_finished';

/** Represents project type */
export type FbEnumProjectType = 1 | 2 | 10 | 3 | 4 | 7;

/** Represents project fields that cannot be updated from backend */
export interface FbProjectReadonlyType {
    resultCount: number;
}

/** Represents project fields that are valid while updating a project stats */
export interface FbProjectUpdateStatsInput {
    contributorCount: number;
    progress: number;
}

/** Represents project fields that are valid while updating a project */
export interface FbProjectUpdateInput {
    image?: string;
    isFeatured: boolean;
    lookFor?: string;
    projectInstruction?: string;
    name: string;
    projectDetails: string;
    projectNumber: number;
    projectRegion: string;
    projectTopic: string;
    projectTopicKey: string;
    requestingOrganisation: string;
    tutorialId: string;
    language: string;
    manualUrl?: string;
    teamId?: string;
    status: FbEnumProjectStatus;
    maxTasksPerUser?: number;
    contributorCount: number;
    progress: number;
}

/** Represents project fields that are valid while creating a project */
export interface FbProjectCreateOnlyInput {
    created: Timestamp;
    createdBy: string;
    groupMaxSize: number;
    groupSize: number;
    projectId: string;
    projectType: FbEnumProjectType;
    requiredResults: number;
    verificationNumber: number;
}

/** Represents mapping group fields that cannot be updated from backend */
export interface FbMappingGroupReadonlyType {
    finishedCount: number;
    progress: number;
}

/** Represents mapping group fields that are valid while creating a mapping group */
export interface FbMappingGroupCreateOnlyInput {
    projectId: string;
    numberOfTasks: number;
    requiredCount: number;
}

/** Represents mapping task fields that are valid while creating a task */
export interface FbMappingTaskCreateOnlyInput {
    projectId: string;
}

/** Represents a mapswipe project */
export interface FbMappingResult {
    appVersion: string;
    clientType?: string;
    endTime: Timestamp;
    startTime: Timestamp;
    results?: Record<string, number>;
    usergroups?: Record<string, boolean>;
}

/** Represents a custom sub-option */
export interface FbBaseObjCustomSubOption {
    value: number;
    description: string;
}

/** Represents a custom option */
export interface FbObjCustomOption {
    value: number;
    title: string;
    description: string;
    icon: string;
    iconColor: string;
    subOptions?: FbBaseObjCustomSubOption[];
}

/** Represents COMPARE project fields that are valid while creating a project */
export interface FbProjectCompareCreateOnlyInput {
    zoomLevel: number;
    tileServer: FbObjRasterTileServer;
    tileServerB: FbObjRasterTileServer;
}

/** Represents COMPARE mapping task fields that are valid while creating a task */
export interface FbMappingTaskCompareCreateOnlyInput {
    groupId: string;
    taskId: string;
    taskX?: number;
    taskY?: number;
    url?: string;
    urlB?: string;
}

export type FbEnumOverlayTileServerType = 'raster' | 'vector';

/** Represents an overlay layer */
export interface FbObjUnifiedOverlayTileServer {
    type: FbEnumOverlayTileServerType;
    raster?: FbObjRasterTileServerOverlay;
    vector?: FbObjVectorTileServerOverlay;
}

/** Represents COMPLETNESS project fields that are valid while creating a project */
export interface FbProjectCompletenessCreateOnlyInput {
    zoomLevel: number;
    tileServer: FbObjRasterTileServer;
    tileServerB: FbObjRasterTileServer;
    overlayTileServer: FbObjUnifiedOverlayTileServer;
}

/** Represents FIND project fields that are valid while creating a project */
export interface FbProjectFindCreateOnlyInput {
    zoomLevel: number;
    tileServer: FbObjRasterTileServer;
}

/** Represents STREET project fields that are valid while creating a project */
export interface FbProjectStreetCreateOnlyInput {
    customOptions?: FbObjCustomOption[];
    numberOfGroups: number;
}

/** Represents STREET mapping group fields that are valid while creating a mapping group */
export interface FbMappingGroupStreetCreateOnlyInput {
    groupId: string;
}

/** Represents STREET mapping task fields that are valid while creating a task */
export interface FbMappingTaskStreetCreateOnlyInput {
    taskId: number;
    groupId: string;
}

/** Represents TILE_MAP_SERVICE mapping group fields that are valid while creating a mapping group */
export interface FbMappingGroupTileMapServiceCreateOnlyInput {
    groupId: string;
    xMax: number;
    xMin: number;
    yMax: number;
    yMin: number;
}

export type FbEnumValidateInputType = 'aoi_file' | 'link' | 'TMId';

/** Represents VALIDATE project fields that are valid while creating a project */
export interface FbProjectValidateCreateOnlyInput {
    customOptions?: FbObjCustomOption[];
    tileServer: FbObjRasterTileServer;
    inputType: FbEnumValidateInputType;
    filter?: string;
    TMId?: string;
}

/** Represents VALIDATE mapping group fields that are valid while creating a mapping group */
export interface FbMappingGroupValidateCreateOnlyInput {
    groupId: string;
}

/** Represents VALIDATE mapping task fields that are valid while creating a task */
export interface FbMappingTaskValidateCreateOnlyInput {
    taskId: string;
    geojson: Record<string, any>;
}

export type FbEnumValidateImageInputType = 'direct_images' | 'dataset_file';

/** Represents VALIDATE_IMAGE project fields that are valid while creating a project */
export interface FbProjectValidateImageCreateOnlyInput {
    customOptions?: FbObjCustomOption[];
}

/** Represents VALIDATE_IMAGE mapping group fields that are valid while creating a mapping group */
export interface FbMappingGroupValidateImageCreateOnlyInput {
    groupId: string;
}

/** Represents VALIDATE_IMAGE mapping task fields that are valid while creating a task */
export interface FbMappingTaskValidateImageCreateOnlyInput {
    taskId: string;
    url: string;
    fileName: string;
    width?: number;
    height?: number;
    annotationId?: string;
    bbox?: number[];
    segmentation?: number[][];
}

/** Represents supported raster tile server */
export type FbEnumRasterTileServerName =
    | 'custom'
    | 'bing'
    | 'mapbox'
    | 'maxarStandard'
    | 'maxarPremium'
    | 'esri'
    | 'esriBeta';

/** Represents a raster tile server configuration */
export interface FbObjRasterTileServer {
    apiKey?: string;
    wmtsLayerName?: string;
    credits: string;
    name: FbEnumRasterTileServerName;
    url: string;
}

/** Represents an overlay layer for raster layer */
export interface FbObjRasterTileServerOverlay {
    tileServer: FbObjRasterTileServer;
    opacity: number;
}

/** Represents supported vector tile server */
export type FbEnumVectorTileServerName = 'custom' | 'openStreetMap' | 'openFreeMap' | 'versatiles';

/** Represents a vector tile server configuration */
export interface FbObjVectorTileServer {
    credits: string;
    name: FbEnumVectorTileServerName;
    sourceLayer: string;
    url: string;
    minZoom: number;
    maxZoom: number;
}

/** Represents an overlay layer for vector layer */
export interface FbObjVectorTileServerOverlay {
    tileServer: FbObjVectorTileServer;
    fillColor: string;
    fillOpacity: number;
    lineColor: string;
    lineOpacity: number;
    lineWidth: number;
    lineDasharray: number[];
    circleColor: string;
    circleOpacity: number;
    circleRadius: number;
}

/** Represents a team to limit project visibility. */
export interface FbTeam {
    teamName: string;
    teamToken: string;
    isArchived: boolean;
}

export type FbEnumInformationPageBlockType = 'text' | 'image';

export interface FbInformationPageBlock {
    blockNumber: number;
    blockType: FbEnumInformationPageBlockType;
    textDescription?: string;
    image?: string;
}

export interface FbInformationPage {
    pageNumber: number;
    title: string;
    blocks?: FbInformationPageBlock[];
}

export interface FbScreenBlock {
    title: string;
    description: string;
    icon: string;
}

export interface FbScreen {
    hint: FbScreenBlock;
    instructions: FbScreenBlock;
    success: FbScreenBlock;
}

export interface FbBaseTutorial {
    exampleImage1?: string;
    exampleImage2?: string;
    contributorCount: number;
    informationPages?: FbInformationPage[];
    lookFor?: string;
    name: string;
    progress: number;
    projectDetails: string;
    projectId: string;
    projectTopicKey: string;
    status: 'tutorial';
    tutorialDraftId: string;
    screens?: FbScreen[];
}

export interface FbBaseTutorialGroup {
    finishedCount: number;
    groupId: number;
    numberOfTasks: number;
    progress: number;
    projectId: string;
    requiredCount: number;
}

export interface FbCompareTutorial {
    projectType: 3;
    tileServer: FbObjRasterTileServer;
    tileServerB: FbObjRasterTileServer;
    zoomLevel: number;
}

export interface FbCompareTutorialTask {
    url: string;
    urlB: string;
}

export interface FbCompletenessTutorial {
    projectType: 4;
    tileServer: FbObjRasterTileServer;
    tileServerB: FbObjRasterTileServer;
    overlayTileServer: FbObjUnifiedOverlayTileServer;
    zoomLevel: number;
}

export interface FbCompletenessTutorialTask {
    url: string;
    urlB: string;
}

export interface FbFindTutorial {
    projectType: 1;
    tileServer: FbObjRasterTileServer;
    zoomLevel: number;
}

export interface FbFindTutorialTask {
    url: string;
}

export interface FbStreetTutorial {
    projectType: 7;
    customOptions?: FbObjCustomOption[];
}

export interface FbStreetTutorialTask {
    projectId: string;
    groupId: number;
    taskId: string;
    geometry: string;
    referenceAnswer: number;
    screen: number;
}

export interface FbTileMapServiceTutorialGroup {
    xMax: number;
    xMin: number;
    yMax: number;
    yMin: number;
}

export interface FbTileMapServiceTutorialTask {
    geometry: string;
    groupId: number;
    projectId: string;
    referenceAnswer: number;
    screen: number;
    taskId: string;
    taskId_real: string;
    taskX: number;
    taskY: number;
}

export interface FbValidateTutorial {
    inputGeometries: string;
    projectType: 2;
    tileServer: FbObjRasterTileServer;
    zoomLevel: number;
    customOptions?: FbObjCustomOption[];
}

export interface FbValidateTutorialTaskProperties {
    id: number;
    screen: number;
    reference: number;
}

export interface FbValidateTutorialTask {
    taskId: string;
    geojson: unknown;
    properties: FbValidateTutorialTaskProperties;
    geometry: string;
}

export interface FbValidateImageTutorial {
    projectType: 10;
    customOptions?: FbObjCustomOption[];
}

export interface FbValidateImageTutorialTask {
    groupId: number;
    projectId: string;
    referenceAnswer: number;
    screen: number;
    geometry: string;
    taskId: string;
    fileName: string;
    url: string;
    width?: number;
    height?: number;
    annotationId?: string;
    bbox?: number[];
    segmentation?: number[][];
}

/** Represents user fields that cannot be updated from backend */
export interface FbUserReadonlyType {
    created: Timestamp;
    lastAppUse?: Timestamp;
    userName?: string;
    userNameKey?: string;
    username?: string;
    usernameKey?: string;
    accessibility?: boolean;
    userGroups?: Record<string, unknown>;
    contributions?: Record<string, unknown>;
    taskContributionCount?: number;
    groupContributionCount?: number;
    projectContributionCount?: number;
}

/** Represents a user */
export interface FbUserUpdateInput {
    teamId?: string;
}

/** Represents a user contribution */
export interface FbUserContribution {
    endTime: Timestamp;
    startTime: Timestamp;
    timestamp: Timestamp;
}

export type FbEnumUserGroupMembershipAction = 'join' | 'leave';

/** Represents a usergroup */
export interface FbUserGroupReadOnlyType {
    users?: Record<string, unknown>;
}

/** Represents a usergroup */
export interface FbUserGroupCreateOnlyInput {
    createdAt: number;
    createdBy: string;
}

/** Represents a usergroup */
export interface FbUserGroupUpdateInput {
    description: string;
    name: string;
    nameKey: string;
    archivedAt?: number;
    archivedBy?: string;
}

/** Represents a usergroup */
export interface FbUserGroupObsolete {
    name: string;
    description: string;
}

/** Represents a user contribution */
export interface FbUserGroupMembership {
    action: FbEnumUserGroupMembershipAction;
    timestamp: number;
    userGroupId: string;
    userId: string;
}

/** Represents if to wait for firebase. */
export interface FbBackendWait {
    ok: boolean;
    timestamp: Timestamp;
}

export const PROJECT_TYPE_FIND = 1 satisfies FbEnumProjectType;
export const PROJECT_TYPE_VALIDATE = 2 satisfies FbEnumProjectType;
export const PROJECT_TYPE_COMPARE = 3 satisfies FbEnumProjectType;
export const PROJECT_TYPE_COMPLETENESS = 4 satisfies FbEnumProjectType;
export const PROJECT_TYPE_STREET = 7 satisfies FbEnumProjectType;
export const PROJECT_TYPE_VALIDATE_IMAGE = 10 satisfies FbEnumProjectType;

type BaseProject = FbProjectCreateOnlyInput & FbProjectUpdateInput;

export type FindProject = BaseProject & FbProjectFindCreateOnlyInput & {
    projectType: typeof PROJECT_TYPE_FIND;
};

export type CompareProject = BaseProject & FbProjectCompareCreateOnlyInput & {
    projectType: typeof PROJECT_TYPE_COMPARE;
};

export type ValidateProject = BaseProject & FbProjectValidateCreateOnlyInput & {
    projectType: typeof PROJECT_TYPE_VALIDATE;
};

export type CompletenessProject = BaseProject & FbProjectCompletenessCreateOnlyInput & {
    projectType: typeof PROJECT_TYPE_COMPLETENESS;
};

export type StreetProject = BaseProject & FbProjectStreetCreateOnlyInput & {
    projectType: typeof PROJECT_TYPE_STREET;
};

export type ValidateImageProject = BaseProject & FbProjectValidateImageCreateOnlyInput & {
    projectType: typeof PROJECT_TYPE_VALIDATE_IMAGE;
};


export type FbProject = FindProject
| CompareProject
| ValidateProject
| CompletenessProject
| StreetProject
| ValidateImageProject;

export type FbTutorial = FbBaseTutorial & (
    FbFindTutorial
    | FbValidateTutorial
    | FbCompareTutorial
    | FbValidateImageTutorial
    | FbCompletenessTutorial
    | FbStreetTutorial
);

export type ValidateTask = FbMappingTaskCreateOnlyInput & FbMappingTaskValidateCreateOnlyInput;

export type FbTask = FbMappingTaskCreateOnlyInput
    & FbMappingTaskValidateCreateOnlyInput
    & FbMappingTaskCompareCreateOnlyInput
    & FbMappingTaskValidateImageCreateOnlyInput
    & FbMappingTaskStreetCreateOnlyInput;


export type TileTask = FbMappingTaskCreateOnlyInput & FbMappingTaskCompareCreateOnlyInput & {
    taskZ: FbProjectFindCreateOnlyInput['zoomLevel'];
};

export type FeatureGeoJson = GeoJSON.FeatureCollection<GeoJSON.Geometry>
    | GeoJSON.Feature<GeoJSON.Geometry>
    | GeoJSON.Geometry;

export type Results = Record<string, number>;

export interface ResultOption {
    value: number;
    label: string;
    color: string;
}

