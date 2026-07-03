import {
    useEffect,
    useMemo,
} from 'react';
import {
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';

import Text from '@/components/Text';
import { showAlert } from '@/components/Toast';
import { type AppTheme } from '@/constants/theme';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseRef } from '@/utils/firebase';
import { type FbAnnouncement } from '@/utils/firebase-generated-types';

// TEMP (dev only): placeholder announcement so the banner is visible while
// testing. v2/announcement is admin-write-only, so there's nothing to read yet.
// Remove this and the __DEV__ fallback below once a real announcement exists.
const TEST_ANNOUNCEMENT: FbAnnouncement = {
    text: 'Test announcement — tap to open mapswipe.org',
    url: 'https://mapswipe.org',
};

const createStyles = (theme: AppTheme) => StyleSheet.create({
    banner: {
        borderColor: theme.primaryBlue,
        borderWidth: 2,
        borderRadius: 6,
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: theme.card,
    },
    text: {
        color: theme.primaryBlue,
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
});

// Optional announcement banner sourced from `v2/announcement` in the Realtime
// Database (mirrors the old app's RecommendedCards announcement). Tapping it
// opens the announcement URL in the in-app WebView. Renders nothing when no
// announcement is set.
function AnnouncementBanner() {
    const router = useRouter();
    const styles = useThemedStyles(createStyles);

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

    // Fall back to the placeholder in dev so the banner can be seen without a
    // configured announcement; production only ever shows a real one.
    const displayed = realAnnouncement ?? (__DEV__ ? TEST_ANNOUNCEMENT : undefined);

    if (isNotDefined(displayed)) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.banner}
            activeOpacity={0.7}
            onPress={() => {
                router.push({
                    pathname: '/WebviewWindow',
                    params: { uri: displayed.url },
                });
            }}
        >
            <Text style={styles.text}>
                {displayed.text}
            </Text>
        </TouchableOpacity>
    );
}

export default AnnouncementBanner;
