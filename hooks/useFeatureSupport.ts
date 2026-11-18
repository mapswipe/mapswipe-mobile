import {
    useContext,
    useMemo,
} from 'react';

import AppUpdateContext from '@/contexts/appUpdate';
import { getMissingFeatures } from '@/utils/features';

export interface FeatureSupport {
    isSupported: boolean;
    missingFeatures: {
        key: string;
        label: string | undefined;
    }[];
    // NOTE: Oldest newer version that supports all the missing features, if known
    updateToVersion: string | undefined;
    // NOTE: A newer version is available, which might support the missing features
    isUpdateAvailable: boolean;
}

// Checks if the installed app supports the features required by a resource. Eg: a project
function useFeatureSupport(requiredFeatures: string[] | undefined): FeatureSupport {
    const {
        supportedFeatures,
        featureLabels,
        missedReleases,
        isUpdateAvailable,
    } = useContext(AppUpdateContext);

    return useMemo(() => {
        const missingFeatures = getMissingFeatures(requiredFeatures ?? [], supportedFeatures);

        const updateToRelease = missingFeatures.length > 0
            ? missedReleases.find((release) => missingFeatures.every(
                (feature) => release.supportedFeatures?.includes(feature),
            ))
            : undefined;

        return {
            isSupported: missingFeatures.length === 0,
            missingFeatures: missingFeatures.map((key) => ({
                key,
                label: featureLabels[key],
            })),
            updateToVersion: updateToRelease?.version,
            isUpdateAvailable,
        };
    }, [requiredFeatures, supportedFeatures, featureLabels, missedReleases, isUpdateAvailable]);
}

export default useFeatureSupport;
