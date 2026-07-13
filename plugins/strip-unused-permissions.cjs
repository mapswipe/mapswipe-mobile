/* eslint-env node */

// Strips Android permissions that get injected automatically but are never used
// by the app. Some come from Expo's default manifest template (SYSTEM_ALERT_WINDOW,
// VIBRATE) and some are pulled in transitively by native libraries — MapLibre adds
// the location permissions even though we never read device location, and there is
// no expo-location dependency or UserLocation component anywhere in the app.
//
// We emit a `tools:node="remove"` entry for each unwanted permission (and drop any
// existing plain declaration first) so the Android manifest merger strips both our
// own and the library-provided declarations from the final merged manifest.

const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

const PERMISSIONS_TO_REMOVE = [
    'android.permission.ACCESS_FINE_LOCATION',
    'android.permission.ACCESS_COARSE_LOCATION',
    'android.permission.ACCESS_WIFI_STATE',
    'android.permission.SYSTEM_ALERT_WINDOW',
    'android.permission.VIBRATE',
];

function stripUnusedPermissions(config) {
    return withAndroidManifest(config, (modConfig) => {
        const { manifest } = modConfig.modResults;

        // `tools:node="remove"` requires the tools namespace on <manifest>.
        AndroidConfig.Manifest.ensureToolsAvailable(modConfig.modResults);

        const existing = Array.isArray(manifest['uses-permission'])
            ? manifest['uses-permission']
            : [];

        // Drop any existing declaration of the permissions we want gone so we
        // don't leave a plain node alongside the removal node.
        const kept = existing.filter(
            (entry) => !PERMISSIONS_TO_REMOVE.includes(entry?.$?.['android:name']),
        );

        const removals = PERMISSIONS_TO_REMOVE.map((name) => ({
            $: {
                'android:name': name,
                'tools:node': 'remove',
            },
        }));

        manifest['uses-permission'] = [...kept, ...removals];

        return modConfig;
    });
}

module.exports = stripUnusedPermissions;
