import {
    useCallback,
    useState,
} from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';

import { type IconName } from '@/components/Icon';
import IconButton from '@/components/IconButton';
import InlineListView from '@/components/InlineListView';
import { TutorialSessionProps } from '@/components/tutorial/types';
import ImageWrapper from '@/components/ValidateImageWrapper';
import { SPACING_3XS } from '@/constants/dimensions';
import {
    FbValidateImageTutorialTask,
    PROJECT_TYPE_VALIDATE_IMAGE,
} from '@/utils/types';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        minHeight: 0,
    },
    // The image fills this slot (ImageWrapper is flex + 100% height). Bounding it
    // with minHeight:0 + overflow:hidden keeps the answer buttons on screen.
    imageSlot: {
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
    },
    buttons: {
        flexShrink: 0,
        paddingVertical: SPACING_3XS,
    },
});

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

    const selectedValue = results[task.taskId];
    const disableOptions = disabled || !!imagesLoading[0];
    const bbox = task.bbox as [number, number, number, number] | undefined;

    return (
        <View style={styles.container}>
            <View style={styles.imageSlot}>
                <ImageWrapper
                    item={task}
                    itemIndex={0}
                    onImageLoadStart={handleImageLoadStart}
                    onImageLoadEnd={handleImageLoadEnd}
                    bbox={bbox}
                />
            </View>
            <InlineListView
                withCenteredContent
                style={styles.buttons}
            >
                {customOptions?.map((option) => (
                    <IconButton
                        key={option.value}
                        name={option.value}
                        title={option.title}
                        iconName={option.icon as IconName}
                        tintColor={option.iconColor}
                        width={50}
                        active={selectedValue === option.value}
                        disabled={disableOptions}
                        textColorVariant="brand"
                        onPress={(value) => handleSelect(task.taskId, value)}
                    />
                ))}
            </InlineListView>
        </View>
    );
}

export default ValidateImageTutorialSession;
