import {
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
} from '@/utils/types';

export const SUPPORTED_PROJECT_TYPES = [
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
];

export const publicDashboardUrl = 'https://community-stage.mapswipe.org';

export const gqlEndpoint = `${process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT}/graphql/`;

export const healthCheckEndpoint = gqlEndpoint.replace(
    /graphql\/?$/,
    'health-check/',
);
export const referrerEndpoint = gqlEndpoint.replace('backend', 'manager');
