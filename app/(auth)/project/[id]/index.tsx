import { useMemo } from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
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
import {
    FONT_SIZE_SM,
    SCREEN_WIDTH,
    SPACING_2XS,
} from '@/constants/dimensions';
import { AppTheme } from '@/constants/theme';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import { getProjectProgressForDisplay } from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';
import { FbProject } from '@/utils/types';

const PROJECT_CARD_HEIGHT = 240;
const PROJECT_CARD_WIDTH = SCREEN_WIDTH;

const createStyles = (theme: AppTheme) => StyleSheet.create({
    name: {
        fontSize: 20,
        fontWeight: 'bold',
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
        height: PROJECT_CARD_HEIGHT,
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
        position: 'absolute',
        zIndex: 2,
    },
    projectDetails: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexGrow: 1,
    },
    projectDetailsText: {
        paddingTop: 16,
        color: theme.card,
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
        flexShrink: 1,
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
    description: {
        paddingHorizontal: SPACING_2XS,
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
        <Page
            title={project?.name ?? 'Project'}
        >
            <BlockListView
                spacing="2xs"
            >
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
                        <View style={styles.projectDetails}>
                            <Text
                                variant="heading"
                                style={styles.projectDetailsText}
                            >
                                {project?.projectTopic}
                            </Text>
                        </View>
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
                <BlockListView
                    spacing="xs"
                    style={styles.description}
                >
                    <View>
                        <EnrichedMarkdownText
                            markdown={project?.projectDetails ?? ''}
                            markdownStyle={{
                                paragraph: {
                                    fontSize: FONT_SIZE_SM,
                                    lineHeight: 20,
                                },
                            }}
                        />
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
