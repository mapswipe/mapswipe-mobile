import BlockListView from "@/components/BlockListView";
import Page from "@/components/Page";
import Text from "@/components/Text";
import { IMAGE_SIZE_MD } from "@/constants/dimensions";
import useFirebaseDatabase from "@/hooks/useFirebaseDatabase";
import { firebaseRef } from "@/utils/firebase";
import { FbProject, FbTutorial } from "@/utils/types";
import { isDefined } from "@togglecorp/fujs";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";

function Tutorial() {
    const { id: projectId } = useLocalSearchParams<{ id: string }>();

    const projectQuery = useMemo(() => (
        firebaseRef(`v2/projects/${projectId}`)
    ), [projectId]);

    const { data: projectDetails } = useFirebaseDatabase<FbProject>({ query: projectQuery });

    const tutorialQuery = useMemo(() => (
        isDefined(projectDetails?.tutorialId)
            ? firebaseRef(`v2/projects/${projectDetails.tutorialId}`)
            : undefined
    ), [projectDetails?.tutorialId]);

    const { data: tutorialDetails } = useFirebaseDatabase<FbTutorial>({ query: tutorialQuery });

    return (
        <>
            <StatusBar style="auto" />
            <Page title="Tutorial">
                <BlockListView withPadding>
                    <BlockListView spacing="xs">
                        <Text variant="heading">
                            {tutorialDetails?.name}
                        </Text>
                        <Text variant="description">
                            {`You are looking for: ${tutorialDetails?.lookFor ?? '--'}`}
                        </Text>
                    </BlockListView>
                    <BlockListView>
                        {tutorialDetails?.informationPages?.map((page) => (
                            <BlockListView key={page.pageNumber}>
                                <Text variant="title">
                                    {page.title}
                                </Text>
                                {page.blocks?.map((block) => {
                                    if(isDefined(block.textDescription)) {
                                        return (
                                            <Text key={block.blockNumber}>
                                                {block.textDescription}
                                            </Text>
                                        );
                                    }

                                    if(isDefined(block.image)) {
                                        return (
                                            <Image
                                                key={block.blockNumber}
                                                style={{
                                                    width: '100%',
                                                    height: IMAGE_SIZE_MD,
                                                }}
                                                source={block.image}
                                            />
                                        );
                                    }

                                    return null;
                                })}
                            </BlockListView>
                        ))}
                        {tutorialDetails?.screens?.map((screen, i) => (
                            <BlockListView
                                key={i}
                                spacing="3xs"
                            >
                                <BlockListView spacing="4xs">
                                    <Text>
                                        {screen.hint.title}
                                    </Text>
                                    <Text>
                                        {screen.hint.description}
                                    </Text>
                                </BlockListView>
                                <BlockListView spacing="4xs">
                                    <Text>
                                        {screen.success.title}
                                    </Text>
                                    <Text>
                                        {screen.success.description}
                                    </Text>
                                </BlockListView>
                                <BlockListView spacing="4xs">
                                    <Text>
                                        {screen.instructions.title}
                                    </Text>
                                    <Text>
                                        {screen.instructions.description}
                                    </Text>
                                </BlockListView>
                            </BlockListView>
                        ))}
                    </BlockListView>
                </BlockListView>
            </Page>
        </>
    );
}

export default Tutorial;
