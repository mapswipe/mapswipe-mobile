import {
    Linking,
    Platform,
} from 'react-native';
import Constants from 'expo-constants';

// NOTE: https://apps.apple.com/us/app/mapswipe/id1133855392
const IOS_APP_STORE_ID = '1133855392';

// NOTE: Used when the store page of the app is not known
const FALLBACK_URL = 'https://mapswipe.org';

// Opens the store page of this app, so the user can update it
async function openAppStore() {
    if (Platform.OS === 'android') {
        const packageName = Constants.expoConfig?.android?.package;
        if (packageName) {
            try {
                await Linking.openURL(`market://details?id=${packageName}`);
            } catch {
                // NOTE: Play Store app is not available
                await Linking.openURL(`https://play.google.com/store/apps/details?id=${packageName}`);
            }
            return;
        }
    }
    if (Platform.OS === 'ios') {
        await Linking.openURL(`itms-apps://apps.apple.com/app/id${IOS_APP_STORE_ID}`);
        return;
    }
    await Linking.openURL(FALLBACK_URL);
}

export default openAppStore;
