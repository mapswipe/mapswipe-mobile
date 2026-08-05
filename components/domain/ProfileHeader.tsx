import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { isDefined } from '@togglecorp/fujs';

import Media from '@/components/ui/Media';
import ProgressBar from '@/components/ui/ProgressBar';
import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import Surface from '@/components/ui/Surface';
import Text from '@/components/ui/Text';
import { FbUser } from '@/firebaseGenerated/extended_models';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import getLevelInfo from '@/utils/getLevel';

function ProfileHeader() {
    const { user } = useAuth();
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
        <Surface colorVariant="brand">
            <Row
                spacing="lg"
                padding="lg"
            >
                <Media
                    source={levelData.badge}
                    key={levelData.title}
                    sizeVariant="md"
                    styleVariant="circle"
                    accessibilityLabel={levelData.title}
                />
                <Stack
                    spacing="3xs"
                    grow="fill"
                >
                    <Text
                        variant="title"
                        colorVariant="onBrand"
                    >
                        {user?.displayName}
                    </Text>
                    <Text
                        variant="label"
                        weight="regular"
                        colorVariant="onBrand"
                    >
                        {`${t('levelX', { level })} (${levelData.title})`}
                    </Text>
                    <ProgressBar
                        progress={progress.percentage}
                        colorVariant="positive"
                        sizeVariant="large"
                    />
                    <Text
                        variant="label"
                        weight="regular"
                        colorVariant="onBrand"
                    >
                        {levelProgressText}
                    </Text>
                </Stack>
            </Row>
        </Surface>
    );
}

export default ProfileHeader;
