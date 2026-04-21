import { useMemo } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';

import heartIcon from '@/assets/images/custom/heart_icon.png';
import mmwhiteLogo from '@/assets/images/custom/mmwhite.png';
import BackButton from '@/components/BackButton';
import BlockListView from '@/components/BlockListView';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import Page from '@/components/Page';
import Text from '@/components/Text';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import { getProjectProgressForDisplay } from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';
import { FbProject } from '@/utils/types';

const PROJECT_CARD_HEIGHT = 220;
const PROJECT_CARD_WIDTH = SCREEN_WIDTH;

const createStyles = (theme: AppTheme) => StyleSheet.create({
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
    projectDetailsText: {
        color: theme.card,
        flexGrow: 1,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    horizontalBar: {
        borderWidth: 0.5,
        borderBottomWidth: 0,
        borderColor: theme.card,
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
        color: theme.card,
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

    const projectQuery = useMemo(() => (
        firebaseRef(`v2/projects/${projectId}`)
    ), [projectId]);

    const styles = useThemedStyles(createStyles, undefined);

    const { data: project } = useFirebaseDatabase<FbProject>({ query: projectQuery });

    return (
        <Page title={project?.name ?? 'Project'}>
            <BlockListView>
                <View>
                    <Image
                        source={project?.image}
                        style={styles.image}
                    />
                    <View style={styles.overlay} />
                    <View style={styles.overlayContainer}>
                        <View style={styles.backButtonContainer}>
                            <BackButton />
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
