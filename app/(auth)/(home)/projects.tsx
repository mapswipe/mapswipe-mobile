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

import BlockListView from '@/components/BlockListView';
import InlineListView from '@/components/InlineListView';
import Link from '@/components/Link';
import Text from '@/components/Text';
import { ICON_SIZE_XL } from '@/constants/dimensions';
import useFirebaseDatabaseList from '@/hooks/useFirebaseDatabaseList';
import useTheme from '@/hooks/useTheme';
import { firebaseRef } from '@/utils/firebase';
import { FbProject } from '@/utils/types';

const styles = StyleSheet.create({
    projectItem: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        boxShadow: [{
            offsetX: 0,
            offsetY: 0,
            spreadDistance: 2,
            blurRadius: 3,
            color: 'rgba(0, 0, 0, .1)',
        }],
    },
    projectImage: {
        height: ICON_SIZE_XL,
        aspectRatio: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    projectImagePlaceholder: {
        height: ICON_SIZE_XL,
        aspectRatio: 1,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
});

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

    const theme = useTheme();

    return (
        <FlatList
            style={{
                backgroundColor: theme.background,
                padding: 20,
            }}
            data={projectList}
            keyExtractor={(project) => project.projectId}
            // eslint-disable-next-line react/no-unstable-nested-components
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            renderItem={({ item: project }) => (
                <BlockListView
                    key={project.projectId}
                    spacing="none"
                    style={styles.projectItem}
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
                    <InlineListView
                        spacing="sm"
                        withPadding
                        withSpaceBetweenContents
                        style={{ alignItems: 'center' }}
                        withoutWrap
                    >
                        <Text>
                            {project.projectTopic}
                        </Text>
                        <Link
                            href={{
                                pathname: '/(auth)/project/[id]',
                                params: {
                                    id: project.projectId,
                                },
                            }}
                            title="Go to project"
                            styleVariant="underline"
                            colorVariant="primaryBlue"
                        />
                    </InlineListView>
                </BlockListView>
            )}
        />
    );
}

export default Projects;
