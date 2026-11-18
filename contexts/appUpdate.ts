import { createContext } from 'react';

import { type AppUpdate } from '@/hooks/useAppUpdate';

export interface AppUpdateContextProps extends AppUpdate {
    // Labels of the features, keyed by feature
    featureLabels: Record<string, string>;
    // Opens the update popup
    showUpdatePrompt: () => void;
}

const AppUpdateContext = createContext<AppUpdateContextProps>({
    installedVersion: undefined,
    latestVersion: undefined,
    isUpdateAvailable: false,
    isUpdateRequired: false,
    missedReleases: [],
    supportedFeatures: [],
    featureLabels: {},
    showUpdatePrompt: () => {},
});

export default AppUpdateContext;
