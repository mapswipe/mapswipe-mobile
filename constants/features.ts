import { AppFeatureEnum } from '@/generated/types/graphql';

// Features this version of the app supports.
// Projects (and other resources) that require any other feature cannot be opened.
// NOTE:
// - Add a feature here once the app supports it.
//   The list is defined in the backend (AppFeatureEnum).
// - It can be overridden for a released version from the backend
//   (App info > release > supported features).
// eslint-disable-next-line import/prefer-default-export
export const SUPPORTED_FEATURES: AppFeatureEnum[] = [];
