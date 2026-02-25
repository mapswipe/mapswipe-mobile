import {
    useCallback,
    useMemo,
} from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { isDefined } from '@togglecorp/fujs';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Page from '@/components/Page';
import Text from '@/components/Text';
import { FbUser } from '@/firebaseGenerated/extended_models';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import {
    firebaseAuth,
    firebaseRef,
} from '@/utils/firebase';

const createStyles = () => StyleSheet.create({
    displayPicture: {
        width: 100,
        aspectRatio: 1,
        borderRadius: 50,
        backgroundColor: '#c0c0c0',
    },
});

function Profile() {
    const { user } = useAuth();
    const styles = useThemedStyles(createStyles);

    const userDetailQuery = useMemo(() => (
        isDefined(user)
            ? firebaseRef(`v2/users/${user.uid}`)
            : undefined
    ), [user]);

    const { data: userDetails } = useFirebaseDatabase<FbUser>(
        { query: userDetailQuery },
    );

    const handleLogout = useCallback(() => {
        firebaseAuth.signOut();
    }, []);

    return (
        <Page title="Profile">
            <BlockListView withPadding>
                <BlockListView withCenteredContent>
                    <Image
                        source={user?.photoURL}
                        style={styles.displayPicture}
                    />
                    <Text variant="title">
                        {user?.displayName}
                    </Text>
                    <BlockListView spacing="2xs">
                        <Text>
                            {`Total contributions: ${userDetails?.taskContributionCount ?? '--'}`}
                        </Text>
                        <Text>
                            {`Project contributions: ${userDetails?.projectContributionCount ?? '--'}`}
                        </Text>
                    </BlockListView>
                </BlockListView>
                <View />
                <View />
                <Button
                    name={undefined}
                    onPress={handleLogout}
                    title="Logout"
                />
            </BlockListView>
        </Page>
    );
}

export default Profile;
