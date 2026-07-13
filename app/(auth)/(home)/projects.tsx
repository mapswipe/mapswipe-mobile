import { useMemo } from 'react';
import {
    FlatList,
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { isNotDefined } from '@togglecorp/fujs';
import {
    equalTo,
    limitToFirst,
    orderByChild,
    query,
} from 'firebase/database';

import AnnouncementBanner from '@/components/AnnouncementBanner';
import BlockListView from '@/components/BlockListView';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import Page from '@/components/Page';
import ProjectTypeIcon from '@/components/ProjectTypeIcon';
import Text from '@/components/Text';
import { SUPPORTED_PROJECT_TYPES } from '@/constants/common';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useFirebaseDatabaseList from '@/hooks/useFirebaseDatabaseList';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { getProjectProgressForDisplay } from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';
import {
    FbProject,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_LOCATE_FEATURES,
    PROJECT_TYPE_STREET,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
} from '@/utils/types';

const CARD_GAP = 10;
const CARD_PADDING = 10;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

const GRADIENT_PALETTE: [string, string][] = [
    ['#9aa0ac', '#6f7686'],
    ['#8a9a8e', '#5f7267'],
    ['#a89f91', '#7d7566'],
    ['#8e99a4', '#5d6b7a'],
    ['#a0949a', '#756370'],
    ['#94a3b0', '#697a89'],
];

function hashId(id: string): number {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
        // eslint-disable-next-line no-bitwise
        hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

function gradientForId(id: string): [string, string] {
    return GRADIENT_PALETTE[hashId(id) % GRADIENT_PALETTE.length];
}

const createStyles = (theme: AppTheme) => (StyleSheet.create({
    columnWrapper: {
        gap: CARD_GAP,
    },
    projects: {
        margin: CARD_PADDING,
        borderRadius: 6,
        backgroundColor: theme.background,
    },
    projectsContent: {
        gap: CARD_GAP,
    },
    projectItemContainer: {
        flex: 1,
        maxWidth: CARD_WIDTH,
    },
}));

const createProjectStyles = (
    theme: AppTheme,
    { width, aspectRatio }: { width: number; aspectRatio: number },
) => StyleSheet.create({
    card: {
        width,
        aspectRatio,
        borderRadius: 6,
        overflow: 'hidden',
        backgroundColor: theme.backgroundMuted,
        boxShadow: [{
            offsetX: 0,
            offsetY: 2,
            blurRadius: 8,
            spreadDistance: 0,
            color: 'rgba(0, 0, 0, 0.12)',
        }],
    },
    background: {
        flex: 1,
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scrim: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64%',
    },
    pill: {
        position: 'absolute',
        top: 9,
        left: 9,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.84)',
        borderRadius: 99,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    pillText: {
        fontSize: 11,
        color: '#333',
        fontWeight: '500',
    },
    bottomContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        gap: 6,
    },
    title: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14.5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    progressTrack: {
        height: 4,
        borderRadius: 99,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    progressFill: {
        height: 4,
        borderRadius: 99,
        backgroundColor: theme.accentRed,
    },
    statRow: {
        alignItems: 'center',
        flexGrow: 0,
    },
    statText: {
        color: 'rgba(255, 255, 255, 0.92)',
        fontSize: 11.5,
    },
});

const projectTypeTextMapping: Record<FbProject['projectType'], string> = {
    [PROJECT_TYPE_FIND]: 'Find Features',
    [PROJECT_TYPE_COMPARE]: 'Compare Dates',
    [PROJECT_TYPE_COMPLETENESS]: 'Check Completeness',
    [PROJECT_TYPE_VALIDATE]: 'Validate Footprints',
    [PROJECT_TYPE_STREET]: 'View Streets',
    [PROJECT_TYPE_VALIDATE_IMAGE]: 'Assess Image',
    [PROJECT_TYPE_LOCATE_FEATURES]: 'Locate Objects',
};

interface ProjectItemProps {
    project: FbProject;
    featured: boolean;
}

function ProjectItem(props: ProjectItemProps) {
    const {
        project,
        featured,
    } = props;

    const theme = useTheme();
    const cardWidth = featured ? (SCREEN_WIDTH - CARD_PADDING * 2) : CARD_WIDTH;
    // Featured cards are full-width 2:1 banners; regular cards stay taller (5/6).
    const cardAspectRatio = featured ? 2 / 1 : 5 / 6;
    const styles = useThemedStyles(createProjectStyles, {
        width: cardWidth,
        aspectRatio: cardAspectRatio,
    });
    const progressLabel = getProjectProgressForDisplay(project.progress);
    const progressNum = Number(progressLabel);
    const gradient = gradientForId(project.projectId);

    const cardContent = (
        <>
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.72)']}
                style={styles.scrim}
            />
            <View style={styles.pill}>
                <ProjectTypeIcon
                    type={project.projectType}
                    size={12}
                    color="#333"
                />
                <Text style={styles.pillText}>
                    {projectTypeTextMapping[project.projectType]}
                </Text>
            </View>
            <View style={styles.bottomContent}>
                <Text
                    style={styles.title}
                    numberOfLines={2}
                >
                    {project.projectTopic}
                </Text>
                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${progressNum}%` },
                        ]}
                    />
                </View>
                <InlineListView
                    style={styles.statRow}
                    spacing="4xs"
                >
                    <Text style={{ ...styles.statText, color: theme.accentRed }}>
                        ❤
                    </Text>
                    <Text style={styles.statText}>
                        {`${progressLabel}% by ${project.contributorCount ?? 0} mapper${(project.contributorCount ?? 0) === 1 ? '' : 's'}`}
                    </Text>
                </InlineListView>
            </View>
        </>
    );

    return (
        <Link
            href={{
                pathname: '/(auth)/project/[id]',
                params: {
                    id: project.projectId,
                },
            }}
            styleVariant="action"
            withoutPadding
        >
            <View style={styles.card}>
                <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.background}
                >
                    {project.image && (
                        <Image
                            source={project.image}
                            contentFit="cover"
                            style={styles.backgroundImage}
                        />
                    )}
                    {cardContent}
                </LinearGradient>
            </View>
        </Link>
    );
}

function Projects() {
    const projectsQuery = useMemo(() => (
        query(
            firebaseRef('v2/projects'),
            orderByChild('status'),
            equalTo('active'),
            limitToFirst(40),
        )
    ), []);

    const { list: projectList } = useFirebaseDatabaseList<FbProject>({ query: projectsQuery });

    const filteredProjects = useMemo(() => {
        const sortedProjects = [...projectList]
            .filter((project) => {
                if (!project.projectType) {
                    return false;
                }
                if (
                    !['active', 'private_active'].includes(
                        project.status,
                    )
                ) {
                    return false;
                }
                if (
                    !SUPPORTED_PROJECT_TYPES.includes(
                        project.projectType,
                    )
                ) {
                    return false;
                }
                if (
                    project.projectType === PROJECT_TYPE_COMPLETENESS
                ) {
                    if (
                        project.overlayTileServer?.type
                        === 'raster'
                    ) {
                        return true;
                    }
                    if (
                        isNotDefined(
                            project.overlayTileServer?.type,
                        )
                    ) {
                        return true;
                    }
                    return false;
                }
                return true;
            });
        sortedProjects.sort((a, b) => +b.isFeatured - +a.isFeatured);

        return sortedProjects;
    }, [projectList]);

    const featuredProjects = useMemo(() => (
        filteredProjects?.filter((item) => item.isFeatured)
    ), [filteredProjects]);

    const nonFeaturedProjects = useMemo(() => (
        filteredProjects?.filter((item) => !item.isFeatured)
    ), [filteredProjects]);

    const styles = useThemedStyles(createStyles);

    return (
        <Page
            title="Projects"
            scrollable={false}
        >
            <FlatList
                style={styles.projects}
                data={nonFeaturedProjects}
                numColumns={2}
                keyExtractor={(project) => project.projectId}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.projectsContent}
                ListHeaderComponent={(
                    <BlockListView
                        spacing="2xs"
                    >
                        <AnnouncementBanner />
                        {featuredProjects.map((project) => (
                            <ProjectItem
                                key={project.projectId}
                                project={project}
                                featured
                            />
                        ))}
                    </BlockListView>
                )}
                renderItem={({ item: project }) => (
                    <View style={styles.projectItemContainer}>
                        <ProjectItem
                            key={project.projectId}
                            project={project}
                            featured={false}
                        />
                    </View>
                )}
            />
        </Page>
    );
}

export default Projects;
