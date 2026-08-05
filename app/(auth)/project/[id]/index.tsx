import {
    useCallback,
    useMemo,
} from 'react';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import {
    useLocalSearchParams,
    useRouter,
} from 'expo-router';

import heartIcon from '@/assets/images/custom/heart_icon.png';
import mmwhiteLogo from '@/assets/images/custom/mmwhite.png';
import Box from '@/components/ui/Box';
import IconButton from '@/components/ui/IconButton';
import Link from '@/components/ui/Link';
import Media from '@/components/ui/Media';
import MediaHeader from '@/components/ui/MediaHeader';
import Screen from '@/components/ui/Screen';
import Text from '@/components/ui/Text';
import { WORDMARK_SIZE } from '@/constants/size';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { getProjectProgressForDisplay } from '@/utils/common';
import { firebaseRef } from '@/utils/firebase';
import { type FbProject } from '@/utils/types';

const BACK_LABEL = 'Go back';

const ORGANISATION_NAME = 'Missing Maps';

function ProjectDetail() {
    const { id: projectId } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const projectQuery = useMemo(() => (
        firebaseRef(`v2/projects/${projectId}`)
    ), [projectId]);

    const { data: project } = useFirebaseDatabase<FbProject>({ query: projectQuery });

    // progress is a percentage from 0 to 100. Completion blocks mapping, not the tutorial.
    const isProjectComplete = (project?.progress ?? 0) >= 100;

    // This screen can open from a notification with no history behind it.
    const handleBackPress = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.push('/');
    }, [router]);

    const contributionSummary = `${getProjectProgressForDisplay(project?.progress ?? 0)}% global progress by ${project?.contributorCount ?? 0} mappers just like you.`;

    const mapLabel = isProjectComplete ? 'Project completed' : 'Map now';

    return (
        <Screen
            title={project?.name ?? 'Project'}
            padding="xs"
            footer={(
                <>
                    <Link
                        href={{
                            pathname: '/project/[id]/tutorial',
                            params: {
                                id: projectId,
                            },
                        }}
                        colorVariant="positive"
                        title="Start tutorial"
                        accessibilityLabel="Start tutorial"
                    />
                    <Link
                        href={{
                            pathname: '/project/[id]/map',
                            params: {
                                id: projectId,
                                projectInstruction: project?.projectInstruction,
                            },
                        }}
                        colorVariant="brand"
                        title={mapLabel}
                        accessibilityLabel={mapLabel}
                        // expo-router's Link ignores `disabled`, so the press is blocked via state.
                        state={isProjectComplete ? 'disabled' : 'default'}
                    />
                </>
            )}
            hero={(
                <MediaHeader
                    source={project?.image}
                    title={project?.projectTopic ?? ''}
                    withoutImageAccessibilityLabel
                    action={(
                        <IconButton
                            name="back"
                            iconName="arrow-left"
                            accessibilityLabel={BACK_LABEL}
                            colorVariant="onImage"
                            onPress={handleBackPress}
                        />
                    )}
                    footer={(
                        <>
                            <Media
                                source={heartIcon}
                                sizeVariant="xs"
                                withoutAccessibilityLabel
                            />
                            <Text
                                variant="label"
                                colorVariant="onImage"
                                flex="shrink"
                            >
                                {contributionSummary}
                            </Text>
                            <Box
                                width={WORDMARK_SIZE.width}
                                height={WORDMARK_SIZE.height}
                            >
                                <Media
                                    source={mmwhiteLogo}
                                    sizeVariant="fill"
                                    fit="contain"
                                    accessibilityLabel={ORGANISATION_NAME}
                                />
                            </Box>
                        </>
                    )}
                />
            )}
        >
            <EnrichedMarkdownText
                markdown={project?.projectDetails ?? ''}
            />
        </Screen>
    );
}

export default ProjectDetail;
