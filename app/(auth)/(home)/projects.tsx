import { useMemo } from 'react';
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

import AnnouncementBanner from '@/components/AnnouncementBanner';
import ProjectCard from '@/components/domain/ProjectCard';
import Box from '@/components/ui/Box';
import ListView from '@/components/ui/ListView';
import Screen from '@/components/ui/Screen';
import Stack from '@/components/ui/Stack';
import { SUPPORTED_PROJECT_TYPES } from '@/constants/common';
import useAuth from '@/hooks/useAuth';
import useFirebaseDatabaseList from '@/hooks/useFirebaseDatabaseList';
import { firebaseRef } from '@/utils/firebase';
import {
    FbProject,
    PROJECT_TYPE_COMPLETENESS,
} from '@/utils/types';

const COLUMN_COUNT = 2;

const EMPTY_MESSAGE = 'No projects are available right now. Please check back later.';

// FlatList does not pad the last row of a numColumns grid, so a filler cell holds the column open.
const FILLER = 'filler';

type GridItem = FbProject | typeof FILLER;

function selectGridKey(item: GridItem): string {
    return item === FILLER ? FILLER : item.projectId;
}

function renderGridItem(item: GridItem) {
    return (
        <Box flex={1}>
            {item === FILLER ? null : <ProjectCard project={item} />}
        </Box>
    );
}

function Projects() {
    const { userDetails, userDetailsPending } = useAuth();

    const teamId = userDetails?.teamId;

    const projectsQuery = useMemo(() => {
        if (isDefined(teamId)) {
            return query(
                firebaseRef('v2/projects'),
                orderByChild('teamId'),
                equalTo(teamId),
                limitToFirst(40),
            );
        }
        return query(
            firebaseRef('v2/projects'),
            orderByChild('status'),
            equalTo('active'),
            limitToFirst(40),
        );
    }, [teamId]);

    // Waiting on the profile avoids flashing public projects while teamId is still unknown.
    const { list: projectList, pending: projectsPending } = useFirebaseDatabaseList<FbProject>({
        query: projectsQuery,
        skip: userDetailsPending,
    });

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

    const gridItems = useMemo<GridItem[]>(() => {
        if (nonFeaturedProjects.length % COLUMN_COUNT === 0) {
            return nonFeaturedProjects;
        }

        return [...nonFeaturedProjects, FILLER];
    }, [nonFeaturedProjects]);

    return (
        <Screen
            title="Projects"
            layout="fill"
        >
            <ListView
                data={gridItems}
                keySelector={selectGridKey}
                renderItem={renderGridItem}
                numColumns={COLUMN_COUNT}
                spacing="3xs"
                padding="3xs"
                grow="slot"
                header={(
                    <Stack spacing="2xs">
                        <AnnouncementBanner />
                        {featuredProjects.map((project) => (
                            <ProjectCard
                                key={project.projectId}
                                project={project}
                            />
                        ))}
                    </Stack>
                )}
                // A skipped query is not pending, so the wait has to include the profile.
                pending={userDetailsPending || projectsPending}
                // Featured cards render in the header, so "no projects" would be wrong beside them.
                emptyMessage={featuredProjects.length === 0 ? EMPTY_MESSAGE : undefined}
            />
        </Screen>
    );
}

export default Projects;
