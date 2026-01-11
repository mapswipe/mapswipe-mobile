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
import useTheme from "@/hooks/useTheme";
import { ICON_SIZE_XL } from "@/constants/dimensions";

const styles = StyleSheet.create({
    projectItem: {
        backgroundColor: '#ffffff',
    },
    projectImage: {
        height: ICON_SIZE_XL,
        aspectRatio: 1,
        borderRadius: 20,
    },
    projectImagePlaceholder: {
        height: ICON_SIZE_XL,
        aspectRatio: 1,
        borderRadius: 20,
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
            data={projectList}
            keyExtractor={(project) => project.projectId}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.border }} />}
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
                            style={[
                                styles.projectImagePlaceholder,
                                { backgroundColor: theme.primaryLight },
                            ]}
                        />
                    )}
                    <BlockListView
                        spacing="2xs"
                        style={{
                            flexShrink: 1,
                            flexGrow: 1,
                        }}
                    >
                        <Text variant="title">
                            {project.projectTopic}
                        </Text>
                        <BlockListView
                            spacing="3xs"
                            style={{
                                flexShrink: 1,
                                flexGrow: 1,
                            }}
                        >
                            <Text variant="description">
                                {project.projectRegion}
                                {isDefined(project.projectNumber) ? ` (${project.projectNumber})` : null}
                            </Text>
                            <Text variant="description">
                                {project.requestingOrganisation}
                            </Text>
                        </BlockListView>
                        <InlineListView>
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
                        </InlineListView>
                    </BlockListView>
                </InlineListView>
            )}
        />
    );
}

export default Projects;
