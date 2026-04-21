import {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    FlatList,
    StyleSheet,
} from 'react-native';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { decode } from 'base-64';
import { inflate } from 'pako';

import BlockListView from '@/components/BlockListView';
import { type IconName } from '@/components/Icon';
import IconButton from '@/components/IconButton';
import InlineListView from '@/components/InlineListView';
import ImageWrapper from '@/components/ValidateImageWrapper';
import { SCREEN_WIDTH } from '@/constants/dimensions';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import useThemedStyles from '@/hooks/useThemedStyles';
import { firebaseRef } from '@/utils/firebase';
import {
    Results,
    ValidateImageProject,
    ValidateImageTask,
} from '@/utils/types';

type RefType = FlatList<ValidateImageTask> | null;
const viewabilityConfig = {
    viewAreaCoveragePercentThreshold: 50,
};

const createStyles = () => (
    StyleSheet.create({
        view: {
            flex: 1,
            flexDirection: 'column',
        },
        tasks: {
            flex: 2,
            width: SCREEN_WIDTH,
        },
        buttons: {
            flexGrow: 0,
            flexShrink: 0,
            padding: 20,
        },
    })
);

interface Props {
    taskGroupId: string;
    projectDetails: ValidateImageProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
}

function ValidateImageMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        onResultsChange,
        results,
    } = props;
    const styles = useThemedStyles(createStyles);

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [imagesLoading, setImagesLoading] = useState<Record<number, boolean>>({});

    const taskQuery = useMemo(() => (
        firebaseRef(`v2/tasks/${projectDetails.projectId}/${taskGroupId}`)
    ), [projectDetails.projectId, taskGroupId]);

    const { data: compressedTasks } = useFirebaseDatabase<string>({
        query: taskQuery,
    });

    const taskList = useMemo(() => {
        if (isNotDefined(compressedTasks)) {
            return [];
        }
        if (Array.isArray(compressedTasks)) {
            return compressedTasks;
        }
        if (typeof compressedTasks !== 'string') {
            return [];
        }

        const decodedStr = decode(compressedTasks);
        const charList = decodedStr.split('').map((splitteStr) => splitteStr.charCodeAt(0));
        const binaryCompressedTasks = new Uint8Array(charList);
        const decompressedTasks = inflate(binaryCompressedTasks, { to: 'string' });

        // FIXME: add schema validation
        return JSON.parse(decompressedTasks) as unknown[];
    }, [compressedTasks]);

    const currentTask = taskList[currentTaskIndex] as ValidateImageTask | undefined;
    const maxTasks = taskList.length;

    const options = projectDetails.customOptions;

    const flatListRef = useRef<RefType>(null);

    const handleAnswerSelect = useCallback((newValue: number) => {
        if (isDefined(currentTask)) {
            onResultsChange((prevResults) => ({
                ...prevResults,
                [currentTask.taskId]: newValue,
            }));
        }

        const nextIndex = currentTaskIndex + 1;
        if (nextIndex < maxTasks) {
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: nextIndex,
                    animated: true,
                });
            }, 0);
        }
    }, [currentTask, onResultsChange, maxTasks, currentTaskIndex]);

    const selectedValue = isDefined(currentTask)
        ? results[currentTask.taskId]
        : undefined;

    let totalSwipedTasks = 0;
    if (results) {
        totalSwipedTasks = Object.keys(results).length;
        if ('startTime' in results) {
            totalSwipedTasks -= 1;
        }
    }

    const limitedTasks = [...(taskList ?? [])].slice(0, totalSwipedTasks + 1);

    const onViewableItemsChanged = useCallback(({
        viewableItems,
    }: { viewableItems: { index: number | null | undefined }[] }) => {
        if (viewableItems.length > 0) {
            const { index } = viewableItems[0];
            if (index !== undefined && index !== null) {
                setCurrentTaskIndex(index);
            }
        }
    }, []);

    const handleImageLoadStart = useCallback((itemIndex: number) => {
        setImagesLoading((oldVal) => ({
            ...oldVal,
            [itemIndex]: true,
        }));
    }, []);

    const handleImageLoadEnd = useCallback((itemIndex: number) => {
        setImagesLoading((oldVal) => ({
            ...oldVal,
            [itemIndex]: false,
        }));
    }, []);

    const disableOptions = !!imagesLoading[currentTaskIndex];

    return (
        <BlockListView style={styles.view}>
            <FlatList
                style={styles.tasks}
                ref={flatListRef}
                data={limitedTasks}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <ImageWrapper
                        item={item}
                        itemIndex={index}
                        onImageLoadStart={handleImageLoadStart}
                        onImageLoadEnd={handleImageLoadEnd}
                        bbox={item.bbox}
                    />
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                horizontal
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH,
                    offset: SCREEN_WIDTH * index,
                    index,
                })}
                pagingEnabled
                showsHorizontalScrollIndicator={false}
            />
            <InlineListView
                withCenteredContent
                style={styles.buttons}
            >
                {options?.map((option) => (
                    <IconButton
                        name={option.value}
                        key={option.value}
                        title={option.title}
                        onPress={handleAnswerSelect}
                        // FIXME: No casting
                        iconName={option.icon as IconName}
                        tintColor={option.iconColor}
                        active={selectedValue === option.value}
                        disabled={disableOptions}
                        textColorVariant="brand"
                    />
                ))}
            </InlineListView>
        </BlockListView>
    );
}

export default ValidateImageMappingSession;
