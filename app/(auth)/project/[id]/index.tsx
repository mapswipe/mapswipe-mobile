import { useMemo } from 'react';
import {
    StatusBar as NativeStatusBar,
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import BlockListView from '@/components/BlockListView';
import Link from '@/components/Link';
import Text from '@/components/Text';
import { type AppTheme } from '@/constants/theme';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseRef } from '@/utils/firebase';
import { FbProject } from '@/utils/types';

const createStyles = (theme: AppTheme) => StyleSheet.create({
    mainView: {
        position: 'absolute',
        top: 0,
        width: '100%',
        height: NativeStatusBar.currentHeight,
        backgroundColor: theme.primaryDark,
        opacity: 0.33,
        zIndex: 1,
    },
    image: {
        width: '100%',
        height: 300,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    detailsContainer: {
        minHeight: 140,
    },
});

export default function ProjectDetail() {
    const { id: projectId } = useLocalSearchParams<{ id: string }>();

    const projectQuery = useMemo(() => (
        firebaseRef(`v2/projects/${projectId}`)
    ), [projectId]);

    const styles = useThemedStyles(createStyles, undefined);

    const { data: project } = useFirebaseDatabase<FbProject>({ query: projectQuery });

    return (
        <>
            <StatusBar style="inverted" />
            <BlockListView>
                <View
                    style={styles.mainView}
                />
                <Image
                    source={project?.image}
                    style={styles.image}
                />
                <BlockListView withPadding>
                    <Text style={styles.name}>
                        {project?.name}
                    </Text>
                    <View style={styles.detailsContainer}>
                        <Text>
                            {project?.projectDetails}
                        </Text>
                    </View>
                    <Link
                        href={{
                            pathname: '/project/[id]/tutorial',
                            params: {
                                id: projectId,
                            },
                        }}
                    >
                        Start tutorial
                    </Link>
                    <Link
                        href={{
                            pathname: '/project/[id]/map',
                            params: {
                                id: projectId,
                            },
                        }}
                    >
                        Map now
                    </Link>
                </BlockListView>
            </BlockListView>
        </>
    );
}
