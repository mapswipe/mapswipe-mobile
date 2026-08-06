import {
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import { useRouter } from 'expo-router';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import { showAlert } from '@/components/Toast';
import Banner from '@/components/ui/Banner';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import { type FbAnnouncement } from '@/utils/firebase-generated-types';

// TEMP (dev only): placeholder announcement; remove once a real v2/announcement exists.
const TEST_ANNOUNCEMENT: FbAnnouncement = {
    text: 'Test announcement — tap to open mapswipe.org',
    url: 'https://mapswipe.org',
};

// Untranslated: no namespace ships a key for this yet.
const OPEN_ACTION_LABEL = 'Opens the announcement';

function AnnouncementBanner() {
    const router = useRouter();

    const announcementQuery = useMemo(() => firebaseRef('v2/announcement'), []);
    const { data: announcement, error } = useFirebaseDatabase<FbAnnouncement>({
        query: announcementQuery,
    });

    useEffect(() => {
        if (isDefined(error)) {
            showAlert({
                title: 'Announcement',
                message: 'Failed to fetch announcement.',
                alertType: 'error',
            });
        }
    }, [error]);

    const realAnnouncement = isDefined(announcement)
        && isDefined(announcement.text)
        && isDefined(announcement.url)
        ? announcement
        : undefined;

    const displayed = realAnnouncement ?? (__DEV__ ? TEST_ANNOUNCEMENT : undefined);

    const url = displayed?.url;

    const handlePress = useCallback(() => {
        router.push({
            pathname: '/WebviewWindow',
            params: { uri: url },
        });
    }, [router, url]);

    if (isNotDefined(displayed)) {
        return null;
    }

    return (
        <Banner
            title={displayed.text}
            colorVariant="brand"
            styleVariant="outlined"
            sizeVariant="compact"
            align="center"
            onPress={handlePress}
            accessibilityLabel={`${displayed.text}. ${OPEN_ACTION_LABEL}`}
        />
    );
}

export default AnnouncementBanner;
