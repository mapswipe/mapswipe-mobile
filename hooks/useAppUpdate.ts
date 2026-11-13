import { useMemo } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { isDefined } from '@togglecorp/fujs';
import {
    endAt,
    orderByChild,
    query,
    startAfter,
} from 'firebase/database';

import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import { type FbAppInfoRelease } from '@/utils/firebase-generated-types';
import {
    isOlder,
    toVersionCode,
} from '@/utils/version';

// TEST_VERSION_CHECK: To test on web (eg. `pnpm web`), use the android app info instead:
// const platform = Platform.OS === 'ios' ? 'ios' : 'android';
const platform = Platform.OS === 'ios' || Platform.OS === 'android'
    ? Platform.OS
    : undefined;

export interface AppUpdate {
    installedVersion: string | undefined;
    latestVersion: string | undefined;
    // NOTE: Installed version is older than the latest version
    isUpdateAvailable: boolean;
    // NOTE: Installed version is older than the minimum supported version
    isUpdateRequired: boolean;
    // NOTE: Releases newer than the installed version, up to the latest version (ascending)
    missedReleases: FbAppInfoRelease[];
}

// Compares the installed app version with `v2/appInfo/{platform}`.
// Only the releases the device is missing are fetched, using a range query on `versionCode`.
function useAppUpdate(): AppUpdate {
    // TEST_VERSION_CHECK: To test, pretend an older version is installed instead:
    // const installedVersion = '3.0.9';
    // Compared to the app info set in the admin (eg. latest 3.0.11):
    // - Older than the latest version -> soft block: dismissible popup and banner
    // - Also older than the min supported version -> hard block: popup cannot be dismissed
    // - Same as the latest version -> nothing
    const installedVersion = Constants.expoConfig?.version;

    const latestVersionQuery = useMemo(
        () => (platform ? firebaseRef(`v2/appInfo/${platform}/latestVersion`) : undefined),
        [],
    );
    const minSupportedVersionQuery = useMemo(
        () => (platform ? firebaseRef(`v2/appInfo/${platform}/minSupportedVersion`) : undefined),
        [],
    );

    const { data: latestVersion } = useFirebaseDatabase<string>({
        query: latestVersionQuery,
        skip: !latestVersionQuery,
    });
    const { data: minSupportedVersion } = useFirebaseDatabase<string>({
        query: minSupportedVersionQuery,
        skip: !minSupportedVersionQuery,
    });

    const isUpdateAvailable = isDefined(installedVersion)
        && isDefined(latestVersion)
        && isOlder(installedVersion, latestVersion);
    const isUpdateRequired = isDefined(installedVersion)
        && isDefined(minSupportedVersion)
        && isOlder(installedVersion, minSupportedVersion);

    const missedReleasesQuery = useMemo(() => {
        if (!platform || !isUpdateAvailable) {
            return undefined;
        }
        return query(
            firebaseRef(`v2/appInfo/${platform}/releases`),
            orderByChild('versionCode'),
            startAfter(toVersionCode(installedVersion)),
            endAt(toVersionCode(latestVersion)),
        );
    }, [isUpdateAvailable, installedVersion, latestVersion]);

    const { data: missedReleasesByKey } = useFirebaseDatabase<Record<string, FbAppInfoRelease>>({
        query: missedReleasesQuery,
        skip: !missedReleasesQuery,
    });

    const missedReleases = useMemo(
        () => (isDefined(missedReleasesQuery) && isDefined(missedReleasesByKey)
            ? Object.values(missedReleasesByKey).sort((a, b) => a.versionCode - b.versionCode)
            : []),
        [missedReleasesQuery, missedReleasesByKey],
    );

    return useMemo(() => ({
        installedVersion,
        latestVersion,
        isUpdateAvailable,
        isUpdateRequired,
        missedReleases,
    }), [installedVersion, latestVersion, isUpdateAvailable, isUpdateRequired, missedReleases]);
}

export default useAppUpdate;
