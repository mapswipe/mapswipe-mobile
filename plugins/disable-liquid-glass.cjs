/* eslint-env node */

// FIXME: Remove once react-native-screens handles iOS 26 Liquid Glass natively.
// This plugin injects a line into AppDelegate.swift to opt out of the glass
// navigation bar style, which causes off-center icons in header buttons.

const { withAppDelegate } = require('expo/config-plugins');

const INJECTION = '    UINavigationBar.appearance().preferredBehavioralStyle = .pad';

function disableLiquidGlass(config) {
    return withAppDelegate(config, (modConfig) => {
        const contents = modConfig.modResults.contents;

        if (contents.includes('preferredBehavioralStyle')) {
            return modConfig;
        }

        // Insert right after the super.application() return in didFinishLaunchingWithOptions
        modConfig.modResults.contents = contents.replace(
            'return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
            `${INJECTION}\n\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`,
        );

        return modConfig;
    });
}

module.exports = disableLiquidGlass;
