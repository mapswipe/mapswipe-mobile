import BlockListView from "@/components/BlockListView";
import Page from "@/components/Page";
import useFirebaseDatabase from "@/hooks/useFirebaseDatabase";
import { firebaseRef } from "@/utils/firebase";
import { FbProject } from "@/utils/types";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import Text from "@/components/Text";
import Link from "@/components/Link";
import { View } from "react-native";
import { Image } from "expo-image";

export default function ProjectDetail() {
    const { id: projectId } = useLocalSearchParams<{ id: string }>();

    const projectQuery = useMemo(() => (
        firebaseRef(`v2/projects/${projectId}`)
    ), []);

    const { data } = useFirebaseDatabase<FbProject>({ query: projectQuery });

    const project = data;

    return (
        <Page title={project?.name ?? 'Project'}>
            <BlockListView withPadding>
                <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {project?.name}
                </Text>
                <Image
                    source={project?.image}
                    style={{ width: '100%', height: 240 }}
                />
                <View style={{ minHeight: 140 }}>
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
        </Page>
    );
}

