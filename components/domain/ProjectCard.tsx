import {
    isDefined,
    isTruthyString,
} from '@togglecorp/fujs';

import Badge from '@/components/ui/Badge';
import Gradient from '@/components/ui/Gradient';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Media from '@/components/ui/Media';
import Positioned from '@/components/ui/Positioned';
import ProgressBar from '@/components/ui/ProgressBar';
import Row from '@/components/ui/Row';
import Scrim from '@/components/ui/Scrim';
import Stack from '@/components/ui/Stack';
import Surface from '@/components/ui/Surface';
import Text from '@/components/ui/Text';
import { ASPECT } from '@/constants/size';
import { getProjectProgressForDisplay } from '@/utils/common';
import {
    type FbProject,
    PROJECT_TYPE_COMPARE,
    PROJECT_TYPE_COMPLETENESS,
    PROJECT_TYPE_FIND,
    PROJECT_TYPE_LOCATE_FEATURES,
    PROJECT_TYPE_STREET,
    PROJECT_TYPE_VALIDATE,
    PROJECT_TYPE_VALIDATE_IMAGE,
} from '@/utils/types';

// getProjectProgressForDisplay returns a percentage; ProgressBar takes a fraction.
const PERCENT = 100;

const PROJECT_TYPE_LABEL: Record<FbProject['projectType'], string> = {
    [PROJECT_TYPE_FIND]: 'Find Features',
    [PROJECT_TYPE_COMPARE]: 'Compare Dates',
    [PROJECT_TYPE_COMPLETENESS]: 'Check Completeness',
    [PROJECT_TYPE_VALIDATE]: 'Validate Footprints',
    [PROJECT_TYPE_STREET]: 'View Streets',
    [PROJECT_TYPE_VALIDATE_IMAGE]: 'Assess Image',
    [PROJECT_TYPE_LOCATE_FEATURES]: 'Locate Objects',
};

export interface ProjectCardProps {
    project: FbProject;
}

// A character sum, not a bit-shift hash, because the lint config bans bitwise operators.
function hashProjectId(projectId: string): number {
    return Array.from(projectId).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function ProjectCard(props: ProjectCardProps) {
    const { project } = props;

    const progressLabel = getProjectProgressForDisplay(project.progress);
    const contributorCount = project.contributorCount ?? 0;
    const typeLabel = PROJECT_TYPE_LABEL[project.projectType];

    const statLabel = `${progressLabel}% by ${contributorCount} mapper${contributorCount === 1 ? '' : 's'}`;

    // The touchable is one node, so this label must list every visible string.
    const accessibilityLabel = [
        project.projectTopic,
        typeLabel,
        project.projectRegion,
        project.requestingOrganisation,
        statLabel,
    ].filter(isTruthyString).join(', ');

    return (
        <Link
            href={{
                pathname: '/(auth)/project/[id]',
                params: {
                    id: project.projectId,
                },
            }}
            accessibilityLabel={accessibilityLabel}
            styleVariant="transparent"
            padding="none"
        >
            <Surface
                colorVariant="sunken"
                styleVariant="elevated"
                radius="xs"
                aspectRatio={project.isFeatured ? ASPECT.cardFeatured : ASPECT.card}
                flex="fill"
                withClipping
            >
                {/* First child, so it stays behind the imagery. */}
                <Gradient paletteIndex={hashProjectId(project.projectId)} />
                {isTruthyString(project.image) && (
                    <Positioned anchor="fill">
                        <Media
                            source={project.image}
                            sizeVariant="fill"
                            withoutAccessibilityLabel
                        />
                    </Positioned>
                )}
                <Scrim
                    colorVariant="strong"
                    anchor="bottom"
                    fade
                    extent="cardFooter"
                />
                <Stack
                    spacing="none"
                    grow="fill"
                    justify="between"
                >
                    <Row
                        spacing="4xs"
                        padding="3xs"
                        align="start"
                        justify="between"
                    >
                        <Badge
                            shape="pill"
                            sizeVariant="sm"
                            colorVariant="default"
                            label={typeLabel}
                            shrink
                        />
                        {isDefined(project.projectNumber) && (
                            <Badge
                                shape="pill"
                                sizeVariant="sm"
                                colorVariant="onImage"
                                label={String(project.projectNumber)}
                            />
                        )}
                    </Row>
                    <Stack
                        spacing="4xs"
                        padding="2xs"
                    >
                        <Text
                            variant="label"
                            weight="bold"
                            colorVariant="onImage"
                            withLegibilityShadow
                            numberOfLines={2}
                            withoutFontScaling
                        >
                            {project.projectTopic}
                        </Text>
                        {isDefined(project.projectRegion) && (
                            <Row spacing="4xs">
                                <Icon
                                    name="map-pin"
                                    sizeVariant="sm"
                                    colorVariant="onImage"
                                />
                                <Text
                                    variant="caption"
                                    colorVariant="onImage"
                                    flex="fill"
                                    numberOfLines={1}
                                    withoutFontScaling
                                >
                                    {project.projectRegion}
                                </Text>
                            </Row>
                        )}
                        {isDefined(project.requestingOrganisation) && (
                            <Row spacing="4xs">
                                <Icon
                                    name="buildings"
                                    sizeVariant="sm"
                                    colorVariant="onImage"
                                />
                                <Text
                                    variant="caption"
                                    colorVariant="onImage"
                                    flex="fill"
                                    numberOfLines={1}
                                    withoutFontScaling
                                >
                                    {project.requestingOrganisation}
                                </Text>
                            </Row>
                        )}
                        <ProgressBar
                            progress={Number(progressLabel) / PERCENT}
                            colorVariant="accent"
                            sizeVariant="thin"
                            styleVariant="rounded"
                        />
                        <Row spacing="4xs">
                            <Text
                                variant="caption"
                                colorVariant="accent"
                                withoutFontScaling
                            >
                                ❤
                            </Text>
                            <Text
                                variant="caption"
                                colorVariant="onImage"
                                flex="fill"
                                numberOfLines={1}
                                withoutFontScaling
                            >
                                {statLabel}
                            </Text>
                        </Row>
                    </Stack>
                </Stack>
            </Surface>
        </Link>
    );
}

export default ProjectCard;
