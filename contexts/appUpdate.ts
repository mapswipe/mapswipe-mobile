import { createContext } from 'react';

import { type AppUpdate } from '@/hooks/useAppUpdate';

export interface AppUpdateContextProps extends AppUpdate {
    // Opens the update popup
    showUpdatePrompt: () => void;
}

const AppUpdateContext = createContext<AppUpdateContextProps>({
    installedVersion: undefined,
    latestVersion: undefined,
    isUpdateAvailable: false,
    isUpdateRequired: false,
    missedReleases: [],
    showUpdatePrompt: () => {},
});

export default AppUpdateContext;
