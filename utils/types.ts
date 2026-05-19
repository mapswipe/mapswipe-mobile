import type {
    FbBaseTutorial,
    FbCompareTutorial,
    FbCompletenessTutorial,
    FbEnumProjectType,
    FbFindTutorial,
    FbLocateTutorial,
    FbMappingTaskCompareCreateOnlyInput,
    FbMappingTaskCreateOnlyInput,
    FbMappingTaskStreetCreateOnlyInput,
    FbMappingTaskValidateCreateOnlyInput,
    FbMappingTaskValidateImageCreateOnlyInput,
    FbProjectCompareCreateOnlyInput,
    FbProjectCompletenessCreateOnlyInput,
    FbProjectCreateOnlyInput,
    FbProjectFindCreateOnlyInput,
    FbProjectLocateCreateOnlyInput,
    FbProjectStreetCreateOnlyInput,
    FbProjectUpdateInput,
    FbProjectValidateCreateOnlyInput,
    FbProjectValidateImageCreateOnlyInput,
    FbStreetTutorial,
    FbValidateImageTutorial,
    FbValidateTutorial,
} from './firebase-generated-types';

export type {
    FbCompareTutorialTask,
    FbCompletenessTutorialTask,
    FbFindTutorialTask,
    FbInformationPage,
    FbMappingGroupTileMapServiceCreateOnlyInput,
    FbMappingTaskCompareCreateOnlyInput,
    FbObjCustomOption,
    FbObjRasterTileServer,
    FbScreen,
    FbScreenBlock,
    FbStreetTutorialTask,
    FbTileMapServiceTutorialTask,
    FbValidateImageTutorialTask,
    FbValidateTutorialTask,
} from './firebase-generated-types';

export const PROJECT_TYPE_FIND = 1 satisfies FbEnumProjectType;
export const PROJECT_TYPE_VALIDATE = 2 satisfies FbEnumProjectType;
export const PROJECT_TYPE_COMPARE = 3 satisfies FbEnumProjectType;
export const PROJECT_TYPE_COMPLETENESS = 4 satisfies FbEnumProjectType;
export const PROJECT_TYPE_STREET = 7 satisfies FbEnumProjectType;
export const PROJECT_TYPE_VALIDATE_IMAGE = 10 satisfies FbEnumProjectType;
export const PROJECT_TYPE_LOCATE_FEATURES = 9 satisfies FbEnumProjectType;

type BaseProject = FbProjectCreateOnlyInput & FbProjectUpdateInput;

// FIXME: Move these types to firebase
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

export type LocateFeaturesProject = BaseProject & FbProjectLocateCreateOnlyInput & {
    projectType: typeof PROJECT_TYPE_LOCATE_FEATURES;
}

export type FbProject = FindProject
| CompareProject
| ValidateProject
| CompletenessProject
| StreetProject
| ValidateImageProject
| LocateFeaturesProject;

export type FbTutorial = FbBaseTutorial & (
    FbFindTutorial
    | FbValidateTutorial
    | FbCompareTutorial
    | FbValidateImageTutorial
    | FbCompletenessTutorial
    | FbStreetTutorial
    | FbLocateTutorial
);

export type ValidateTask = FbMappingTaskCreateOnlyInput & FbMappingTaskValidateCreateOnlyInput;
export type ValidateImageTask = FbMappingTaskCreateOnlyInput
    & FbMappingTaskValidateImageCreateOnlyInput;

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

export type Results = Record<string, number | number[]>;

export interface ResultOption {
    value: number;
    label: string;
    color: string;
}
