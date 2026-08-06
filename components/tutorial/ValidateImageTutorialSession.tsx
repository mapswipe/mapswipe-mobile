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
import ImageWrapper from '@/components/ui/tile/ValidateImageWrapper';
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
        <Stack
            spacing="none"
            grow="slot"
        >
            {/* ImageWrapper is flex at 100% height, so clip it to keep the buttons on screen. */}
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
            {/* Answers are author data, so each disc takes a raw colour, not a token. */}
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
