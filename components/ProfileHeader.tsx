import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
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

const createStyles = (theme: AppTheme) => StyleSheet.create({
    displayPicture: {
        width: 100,
        height: 100,
        aspectRatio: 1,
        borderRadius: 50,
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
    const styles = useThemedStyles(createStyles);
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
            spacing="lg"
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
                <Text style={styles.progressText}>{levelProgressText}</Text>
            </BlockListView>
        </InlineListView>
    );
}

export default ProfileHeader;
