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

export const supportedLanguages = [
    // follows (hopefully) the order in which they are displayed
    // in wikipedia's list of languages (left side toolbar)
    // as shown on https://en.wikipedia.org/wiki/Main_Page
    { code: 'cs', localeCode: 'cs', name: 'Čeština' },
    { code: 'da', localeCode: 'da', name: 'Dansk' },
    { code: 'de', localeCode: 'de', name: 'Deutsch' },
    { code: 'eo', localeCode: 'eo', name: 'Esperanto' },
    { code: 'et', localeCode: 'et', name: 'Eesti' },
    { code: 'en', localeCode: 'en', name: 'English' },
    { code: 'es', localeCode: 'es', name: 'Español' },
    { code: 'fa_AF', localeCode: 'fa-AF', name: 'دری- افغانستان' },
    { code: 'fr', localeCode: 'fr', name: 'Français' },
    { code: 'it', localeCode: 'it', name: 'Italiano' },
    { code: 'hu', localeCode: 'hu', name: 'Magyar' },
    { code: 'ja', localeCode: 'ja', name: '日本語' },
    { code: 'ne', localeCode: 'ne', name: 'नेपाली' },
    { code: 'nl', localeCode: 'nl', name: 'Nederlands' },
    { code: 'pt', localeCode: 'pt', name: 'Português' },
    { code: 'ru', localeCode: 'ru', name: 'Русский' },
    { code: 'sw', localeCode: 'sw', name: 'Kiswahili' },
    { code: 'zh', localeCode: 'zh', name: '中文' },
];
