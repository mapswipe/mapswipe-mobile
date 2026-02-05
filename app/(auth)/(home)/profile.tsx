import { useMemo } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import { isDefined } from '@togglecorp/fujs';

import BlockListView from '@/components/BlockListView';
import Button from '@/components/Button';
import Page from '@/components/Page';
import Text from '@/components/Text';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import {
    firebaseAuth,
    firebaseRef,
} from '@/utils/firebase';
import { FbUserUpdateInput } from '@/utils/types';

function Profile() {
    const { user } = useAuth();

    const userDetailQuery = useMemo(() => (
        isDefined(user)
            ? firebaseRef(`v2/users/${user.uid}`)
            : undefined
    ), [user]);

    const { data: userDetails } = useFirebaseDatabase<FbUserUpdateInput>(
        { query: userDetailQuery },
    );
    console.log('here', userDetails);

    return (
        <Page title="Profile">
            <BlockListView withPadding>
                <BlockListView
                    style={{ alignItems: 'center' }}
                >
                    <Image
                        source={user?.photoURL}
                        style={{
                            width: 100,
                            aspectRatio: 1,
                            borderRadius: 50,
                            backgroundColor: '#c0c0c0',
                        }}
                    />
                    <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
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
                    onPress={firebaseAuth.signOut}
                    title="Logout"
                />
            </BlockListView>
        </Page>
    );
}

export default Profile;
