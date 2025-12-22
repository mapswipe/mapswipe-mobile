import BlockListView from "@/components/BlockListView";
import useFirebaseDatabaseList from "@/hooks/useFirebaseDatabaseList";
import { firebaseRef } from "@/utils/firebase";
import { FbProject } from "@/utils/types";
import { isDefined, isNotDefined } from "@togglecorp/fujs";
import { equalTo, limitToFirst, orderByChild, query } from "firebase/database";
import { useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { Image } from 'expo-image';
import Text from "@/components/Text";
import Link from "@/components/Link";
import InlineListView from "@/components/InlineListView";

const styles = StyleSheet.create({
    projectItem: {
        backgroundColor: '#ffffff',
    },
    projectImage: {
        width: 120,
        height: 120,
        borderRadius: 20,
    },
    projectImagePlaceholder: {
        width: 120,
        height: 120,
        backgroundColor: '#a1a1a1',
        borderRadius: 20,
    },
    projectTitle: {
        flexGrow: 0,
        flexShrink: 1,
        fontSize: 18,
        fontWeight: 'bold',
    },
    projectDescription: {
        flexGrow: 0,
        flexShrink: 1,
        opacity: 0.5,
    },
    projectRegion: {
        opacity: 0.5,
    }
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

    return (
        <FlatList
            data={projectList}
            keyExtractor={(project) => project.projectId}
            ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
            renderItem={({ item: project }) => (
                <InlineListView
                    key={project.projectId}
                    spacing="sm"
                    withoutWrap
                    style={styles.projectItem}
                    withPadding
                    withoutOpticalCorrection
                >
                    {isDefined(project.image) && (
                        <Image
                            style={styles.projectImage}
                            source={project.image}
                        />
                    )}
                    {isNotDefined(project.image) && (
                        <View
                            style={styles.projectImagePlaceholder}
                        />
                    )}
                    <BlockListView
                        spacing="2xs"
                        style={{
                            flexShrink: 1,
                            flexGrow: 1,
                        }}
                    >
                        <Text style={styles.projectTitle}>
                            {project.projectTopic}
                        </Text>
                        <BlockListView
                            spacing="3xs"
                            style={{
                                flexShrink: 1,
                                flexGrow: 1,
                            }}
                        >
                            <Text style={styles.projectRegion}>
                                {project.projectRegion}
                                {isDefined(project.projectNumber) ? ` (${project.projectNumber})` : null}
                            </Text>
                            <Text style={styles.projectRegion}>
                                {project.requestingOrganisation}
                            </Text>
                        </BlockListView>
                        <Link
                            href={{
                                pathname: '/(auth)/project/[id]',
                                params: {
                                    id: project.projectId,
                                },
                            }}
                        >
                            View details
                        </Link>
                    </BlockListView>
                </InlineListView>
            )}
        />
    );
}

export default Projects;
