import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { isDefined } from '@togglecorp/fujs';

import { FONT_SIZE_SM } from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import { FbUser } from '@/firebase/functions/generated/tsfirebase/extended_models';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseRef } from '@/utils/firebase';
import getLevelInfo from '@/utils/getLevel';

import BlockListView from './BlockListView';
import InlineListView from './InlineListView';
import ProgressBar from './ProgressBar';
import Text from './Text';

const BADGE_MAX_SIZE = 100;
const BADGE_WIDTH_RATIO = 0.22;
const NARROW_WINDOW_WIDTH = 360;

const createStyles = (
    theme: AppTheme,
    { badgeSize }: { badgeSize: number },
) => StyleSheet.create({
    displayPicture: {
        width: badgeSize,
        height: badgeSize,
        aspectRatio: 1,
        borderRadius: badgeSize / 2,
    },
    profileCard: {
        backgroundColor: theme.primaryBlue,
        color: theme.primaryRed,
        alignItems: 'center',
    },
    profileDetail: {
        backgroundColor: theme.primaryBlue,
        color: theme.primaryRed,
        justifyContent: 'center',
        flex: 2,
    },
    profileDetailsText: {
        color: theme.card,
        fontWeight: 'bold',
    },
    levelText: {
        color: theme.card,
        fontSize: FONT_SIZE_SM,
    },
    progressText: {
        color: theme.card,
        fontSize: FONT_SIZE_SM,
    },
});

function ProfileHeader() {
    const { user } = useAuth();
    const { width: windowWidth } = useWindowDimensions();
    const styleOptions = useMemo(() => ({
        badgeSize: Math.min(BADGE_MAX_SIZE, Math.round(windowWidth * BADGE_WIDTH_RATIO)),
    }), [windowWidth]);
    const styles = useThemedStyles(createStyles, styleOptions);
    const { t } = useTranslation('profileScreen');

    const userDetailQuery = useMemo(
        () => (isDefined(user) ? firebaseRef(`v2/users/${user.uid}`) : undefined),
        [user],
    );
    const { data: userDetails } = useFirebaseDatabase<FbUser>({
        query: userDetailQuery,
    });

    const {
        level, sqkm, swipes, levelData, progress,
    } = getLevelInfo(userDetails?.taskContributionCount ?? 0);

    const levelProgressText = t('xTasks(sSwipes)UntilTheNextLevel', {
        sqkm,
        swipes,
    });
    return (
        <InlineListView
            style={styles.profileCard}
            withCenteredContent
            withPadding
            spacing={windowWidth < NARROW_WINDOW_WIDTH ? 'xs' : 'lg'}
        >
            <Image
                source={levelData.badge}
                style={styles.displayPicture}
                key={levelData.title}
                accessibilityLabel={levelData.title}
            />
            <BlockListView
                spacing="3xs"
                style={styles.profileDetail}
            >
                <Text
                    variant="title"
                    style={styles.profileDetailsText}
                >
                    {user?.displayName}
                </Text>
                <Text
                    style={styles.levelText}
                >
                    {`${t('levelX', { level })} (${levelData.title})`}
                </Text>
                <ProgressBar
                    percentage={progress.percentage}
                    colorVariant="green"
                    sizeVariant="large"
                />
                <Text
                    style={styles.progressText}
                >
                    {levelProgressText}
                </Text>
            </BlockListView>
        </InlineListView>
    );
}

export default ProfileHeader;
