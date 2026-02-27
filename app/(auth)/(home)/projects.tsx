import { useMemo } from 'react';
import {
    FlatList,
    StyleSheet,
    View,
} from 'react-native';
import { Image } from 'expo-image';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import {
    equalTo,
    limitToFirst,
    orderByChild,
    query,
} from 'firebase/database';

import heartIcon from '@/assets/images/custom/heart_icon.png';
import BlockListView from '@/components/BlockListView';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import Text from '@/components/Text';
import { SUPPORTED_PROJECT_TYPES } from '@/constants/common';
import {
    FONT_SIZE_XS,
    SCREEN_WIDTH,
} from '@/constants/dimensions';
import { type AppTheme } from '@/constants/theme';
import useFirebaseDatabaseList from '@/hooks/useFirebaseDatabaseList';
import useTheme from '@/hooks/useTheme';
import useThemedStyles from '@/hooks/useThemedStyles';
import { getProjectProgressForDisplay } from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';
import {
    FbProject,
    PROJECT_TYPE_COMPLETENESS,
} from '@/utils/types';

const PROJECT_CARD_HEIGHT = 220;
const PROJECT_CARD_WIDTH = SCREEN_WIDTH / 2 - 15;

const createStyles = (theme: AppTheme) => (StyleSheet.create({
    projects: {
        flex: 1,
        padding: 10,
        backgroundColor: theme.background,
    },
    projectsContent: {
        flex: 1,
        alignItems: 'stretch',
        flexWrap: 'wrap',
        flexDirection: 'row',
        gap: 10,
    },
    projectItem: {
        flex: 1,
        backgroundColor: '#ffffff',
        width: PROJECT_CARD_WIDTH,
        boxShadow: [{
            offsetX: 0,
            offsetY: 0,
            spreadDistance: 2,
            blurRadius: 3,
            color: 'rgba(0, 0, 0, .1)',
        }],
    },
    fullWidthProject: {
        width: SCREEN_WIDTH - 20,
    },
    projectImage: {
        height: 220,
        aspectRatio: 1,
    },
    overlay: {
        top: 0,
        left: 0,
        position: 'absolute',
        width: PROJECT_CARD_WIDTH,
        height: 220,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    overlayContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        position: 'absolute',
        gap: 4,
        top: 0,
        left: 0,
        width: PROJECT_CARD_WIDTH,
        padding: 10,
        height: 220,
    },
    projectDetailsText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    horizontalBar: {
        borderWidth: 0.5,
        borderBottomWidth: 0,
        borderColor: '#fff',
    },
    heartIcon: {
        height: 12,
        width: 12,
    },
    contributionText: {
        color: '#fff',
        fontSize: FONT_SIZE_XS,
    },
    inline: {
        alignItems: 'center',
        flexGrow: 0,
    },
    projectImagePlaceholder: {
        height: PROJECT_CARD_HEIGHT,
        aspectRatio: 1,
    },
}));

function Projects() {
    const projectsQuery = useMemo(() => (
        query(
            firebaseRef('v2/projects'),
            orderByChild('status'),
            equalTo('active'),
            limitToFirst(20),
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
                    // only show "active" and "private_active" projects
                    // (this is only useful for private ones)
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

    const styles = useThemedStyles(createStyles);

    const theme = useTheme();

    return (
        <FlatList
            style={styles.projects}
            data={filteredProjects}
            keyExtractor={(project) => project.projectId}
            contentContainerStyle={styles.projectsContent}
            renderItem={({ item: project }) => (
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
                    <BlockListView
                        key={project.projectId}
                        spacing="none"
                        style={[
                            styles.projectItem,
                            project.isFeatured ? styles.fullWidthProject : undefined,
                        ].filter(isDefined)}
                    >
                        {isDefined(project.image) && (
                            <Image
                                style={styles.projectImage}
                                source={project.image}
                            />
                        )}
                        {isNotDefined(project.image) && (
                            <View
                                style={[
                                    styles.projectImagePlaceholder,
                                    { backgroundColor: theme.backgroundMuted },
                                ]}
                            />
                        )}
                        <View style={styles.overlay} />
                        <View style={styles.overlayContainer}>
                            <Text style={styles.projectDetailsText}>
                                {project.projectTopic}
                            </Text>
                            <View style={styles.horizontalBar} />
                            <InlineListView
                                style={styles.inline}
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
                                    {`${getProjectProgressForDisplay(project.progress)}% by ${project.contributorCount ?? 0} mappers`}
                                </Text>
                            </InlineListView>
                        </View>
                    </BlockListView>
                </Link>
            )}
        />
    );
}

export default Projects;
