// Learn more: https://docs.expo.dev/guides/customizing-metro/
//
// Disable Metro's lazy/async bundling. i18n.ts registers hundreds of locale
// namespaces via i18next-resources-to-backend, each loaded with a dynamic
// `import('./public/locales/<lang>/<ns>.json')`. With lazy bundling enabled
// (Expo's dev-server default), every one of those imports becomes a separate
// async chunk fetched on demand; on native this fails at runtime with
// "Requiring unknown module <id>" on the language splash screen. Inlining the
// dynamic imports into the main bundle resolves them synchronously.
//
// `EXPO_NO_METRO_LAZY` is read live from process.env by the Expo dev server
// (utils/env), so setting it here — before the bundle is requested — disables
// lazy bundling for `expo start` / `expo run:*`. An explicit value from the
// shell or a .env file still takes precedence.
process.env.EXPO_NO_METRO_LAZY = process.env.EXPO_NO_METRO_LAZY ?? '1';

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
