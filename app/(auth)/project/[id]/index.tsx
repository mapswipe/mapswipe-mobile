import { useMemo } from 'react';
import {
    Pressable,
    StatusBar as NativeStatusBar,
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import heartIcon from '@/assets/images/custom/heart_icon.png';
import mmwhiteLogo from '@/assets/images/custom/mmwhite.png';
import BlockListView from '@/components/BlockListView';
import Icon from '@/components/Icon';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import Page from '@/components/Page';
import Text from '@/components/Text';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import { getProjectProgressForDisplay } from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';
import { FbProject } from '@/utils/types';

const PROJECT_CARD_HEIGHT = 220;
const PROJECT_CARD_WIDTH = SCREEN_WIDTH;

const createStyles = (theme: AppTheme) => StyleSheet.create({
    mainView: {
        position: 'absolute',
        top: 0,
        width: '100%',
        height: NativeStatusBar.currentHeight,
        backgroundColor: theme.primaryBlue,
        opacity: 0.33,
        zIndex: 1,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    detailsContainer: {
        minHeight: 140,
    },
    image: {
        width: '100%',
        height: PROJECT_CARD_HEIGHT,
    },
    overlay: {
        top: 0,
        left: 0,
        position: 'absolute',
        width: PROJECT_CARD_WIDTH,
        height: 220,
        textAlign: 'center',
        backgroundColor: 'rgba(52,52,52,0.7)',
    },
    overlayContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        position: 'absolute',
        gap: 4,
        top: 0,
        left: 0,
        width: PROJECT_CARD_WIDTH,
        height: PROJECT_CARD_HEIGHT,
    },
    backButtonContainer: {
        padding: 20,
    },
    backButton: {
        color: '#fff',
    },
    projectDetailsText: {
        color: '#fff',
        flexGrow: 1,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    horizontalBar: {
        borderWidth: 0.5,
        borderBottomWidth: 0,
        borderColor: '#fff',
    },
    heartIcon: {
        height: 24,
        width: 24,
    },
    mmLogo: {
        width: 100,
        height: 30,
        resizeMode: 'contain',
    },
    contributionText: {
        color: '#fff',
    },
    bottomBar: {
        borderTopWidth: 1,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderColor: '#212121',
        backgroundColor: 'rgba(52,52,52,0.5)',
        flexShrink: 0,
        flexWrap: 'nowrap',
        padding: 10,
        alignItems: 'center',
        flexGrow: 0,
    },
});

export default function ProjectDetail() {
    const { id: projectId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const projectQuery = useMemo(() => (
        firebaseRef(`v2/projects/${projectId}`)
    ), [projectId]);

    const styles = useThemedStyles(createStyles, undefined);

    const { data: project } = useFirebaseDatabase<FbProject>({ query: projectQuery });

    return (
        <Page title={project?.name ?? 'Project'}>
            <StatusBar style="inverted" />
            <BlockListView>
                <View
                    style={styles.mainView}
                />
                <View>
                    <Image
                        source={project?.image}
                        style={styles.image}
                    />
                    <View style={styles.overlay} />
                    <View style={styles.overlayContainer}>
                        <View style={styles.backButtonContainer}>
                            <Pressable
                                onPress={() => router.replace('/')}
                            >
                                <Icon style={styles.backButton} name="swipe-left" />
                            </Pressable>
                        </View>
                        <Text
                            variant="heading"
                            style={styles.projectDetailsText}
                        >
                            {project?.projectTopic}
                        </Text>
                        <InlineListView
                            style={styles.bottomBar}
                            spacing="3xs"
                        >
                            <Image
                                style={styles.heartIcon}
                                source={heartIcon}
                            />
                            <Text
                                style={styles.contributionText}
                                variant="label"
                            >
                                {`${getProjectProgressForDisplay(project?.progress ?? 0)}% global progress by ${project?.contributorCount ?? 0} mappers just like you.`}
                            </Text>
                            <Image
                                style={styles.mmLogo}
                                source={mmwhiteLogo}
                            />
                        </InlineListView>
                    </View>
                </View>
                <BlockListView withPadding>
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
                        colorVariant="primaryGreen"
                        title="Start tutorial"
                    />
                    <Link
                        href={{
                            pathname: '/project/[id]/map',
                            params: {
                                id: projectId,
                                projectInstruction: project?.projectInstruction,
                            },
                        }}
                        title="Map now"
                    />
                </BlockListView>
            </BlockListView>
        </Page>
    );
}
