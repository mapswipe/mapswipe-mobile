import BlockListView from "@/components/BlockListView";
import useFirebaseDatabase from "@/hooks/useFirebaseDatabase";
import { firebaseRef } from "@/utils/firebase";
import { FbProject } from "@/utils/types";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo } from "react";
import Text from "@/components/Text";
import Link from "@/components/Link";
import { View, StatusBar as NativeStatusBar } from "react-native";
import { Image } from "expo-image";
import useTheme from "@/hooks/useTheme";
import { setStatusBarStyle, StatusBar } from "expo-status-bar";

export default function ProjectDetail() {
    const { id: projectId } = useLocalSearchParams<{ id: string }>();

    const projectQuery = useMemo(() => (
        firebaseRef(`v2/projects/${projectId}`)
    ), []);

    const { data } = useFirebaseDatabase<FbProject>({ query: projectQuery });

    const project = data;

    const theme = useTheme();

    return (
        <>
            <StatusBar style="inverted" />
            <BlockListView>
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        width: '100%',
                        height: NativeStatusBar.currentHeight,
                        backgroundColor: theme.primaryDark,
                        opacity: 0.33,
                        zIndex: 1,
                    }}
                />
                <Image
                    source={project?.image}
                    style={{ width: '100%', height: 300 }}
                />
                <BlockListView withPadding>
                    <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
                        {project?.name}
                    </Text>
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
            </BlockListView>
        </>
    );
}

