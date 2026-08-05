import {
    useCallback,
    useState,
} from 'react';

import { TutorialSessionProps } from '@/components/tutorial/types';
import Box from '@/components/ui/Box';
import { type IconName } from '@/components/ui/Icon';
import IconButton from '@/components/ui/IconButton';
import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import ImageWrapper from '@/components/ValidateImageWrapper';
import { getTutorialTaskKey } from '@/utils/tutorial';
import {
    FbValidateImageTutorialTask,
    PROJECT_TYPE_VALIDATE_IMAGE,
} from '@/utils/types';

function ValidateImageTutorialSession(props: TutorialSessionProps) {
    const {
        tutorial,
        tasks,
        results,
        onResultsChange,
        disabled,
    } = props;

    const [imagesLoading, setImagesLoading] = useState<Record<number, boolean>>({});

    const handleSelect = useCallback((taskId: string, value: number) => {
        if (disabled) {
            return;
        }
        onResultsChange((prev) => ({
            ...prev,
            [taskId]: value,
        }));
    }, [disabled, onResultsChange]);

    const handleImageLoadStart = useCallback((itemIndex: number) => {
        setImagesLoading((prev) => ({ ...prev, [itemIndex]: true }));
    }, []);

    const handleImageLoadEnd = useCallback((itemIndex: number) => {
        setImagesLoading((prev) => ({ ...prev, [itemIndex]: false }));
    }, []);

    if (tutorial.projectType !== PROJECT_TYPE_VALIDATE_IMAGE) {
        return null;
    }

    const { customOptions } = tutorial;
    const task = tasks[0] as FbValidateImageTutorialTask | undefined;

    if (!task) {
        return null;
    }

    const selectedValue = results[getTutorialTaskKey(task)];
    const disableOptions = disabled || !!imagesLoading[0];
    const bbox = task.bbox as [number, number, number, number] | undefined;

    return (
        // No gap of its own: the 8pt above and below the answer bar is the bar's own inset, and
        // a Stack gap would only reach the top of it.
        <Stack
            spacing="none"
            grow="slot"
        >
            {/* The image fills this slot (ImageWrapper is flex + 100% height). Bounding it with
                a shrinkable slot and clipping keeps the answer buttons on screen. */}
            <Box
                flex={1}
                minHeight={0}
                clip
            >
                <ImageWrapper
                    item={task}
                    itemIndex={0}
                    onImageLoadStart={handleImageLoadStart}
                    onImageLoadEnd={handleImageLoadEnd}
                    bbox={bbox}
                />
            </Box>
            {/* The answers are the tutorial's own customOptions: per-project author data off
                Firebase, so each disc is filled with IconButton's documented raw-colour prop
                and never with a token from the built-in answer palette. */}
            <Row
                spacing="md"
                padding="3xs"
                justify="center"
                align="stretch"
                wrap
            >
                {customOptions?.map((option) => (
                    <IconButton
                        key={option.value}
                        name={option.value}
                        label={option.title}
                        accessibilityLabel={option.title}
                        sizeVariant="lg"
                        // FIXME: No casting
                        iconName={option.icon as IconName}
                        backendSurfaceColor={option.iconColor}
                        selected={selectedValue === option.value}
                        disabled={disableOptions}
                        labelColorVariant="onBrand"
                        onPress={(value) => handleSelect(getTutorialTaskKey(task), value)}
                    />
                ))}
            </Row>
        </Stack>
    );
}

export default ValidateImageTutorialSession;
