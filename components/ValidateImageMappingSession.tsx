import {
    type Dispatch,
    type SetStateAction,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    isDefined,
    isNotDefined,
} from '@togglecorp/fujs';
import { decode } from 'base-64';
import { inflate } from 'pako';

import { type IconName } from '@/components/ui/Icon';
import IconButton from '@/components/ui/IconButton';
import Pager from '@/components/ui/Pager';
import ProgressBar from '@/components/ui/ProgressBar';
import Row from '@/components/ui/Row';
import Stack from '@/components/ui/Stack';
import ImageWrapper from '@/components/ValidateImageWrapper';
import useFirebaseDatabase from '@/hooks/useFirebaseDatabase';
import { firebaseRef } from '@/utils/firebase';
import {
    Results,
    ValidateImageProject,
    ValidateImageTask,
} from '@/utils/types';

interface Props {
    taskGroupId: string;
    projectDetails: ValidateImageProject;
    onResultsChange: Dispatch<SetStateAction<Results>>;
    results: Results;
    onSessionComplete: () => void;
}

function ValidateImageMappingSession(props: Props) {
    const {
        taskGroupId,
        projectDetails,
        onResultsChange,
        results,
        onSessionComplete,
    } = props;

    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const completedRef = useRef(false);
    const [imagesLoading, setImagesLoading] = useState<Record<number, boolean>>({});

    const taskQuery = useMemo(() => (
        firebaseRef(`v2/tasks/${projectDetails.projectId}/${taskGroupId}`)
    ), [projectDetails.projectId, taskGroupId]);

    const { data: compressedTasks } = useFirebaseDatabase<string>({
        query: taskQuery,
    });

    const taskList = useMemo(() => {
        if (isNotDefined(compressedTasks)) {
            return [] as ValidateImageTask[];
        }
        if (Array.isArray(compressedTasks)) {
            return compressedTasks as ValidateImageTask[];
        }
        if (typeof compressedTasks !== 'string') {
            return [];
        }

        const decodedStr = decode(compressedTasks);
        const charList = decodedStr.split('').map((splitteStr) => splitteStr.charCodeAt(0));
        const binaryCompressedTasks = new Uint8Array(charList);
        const decompressedTasks = inflate(binaryCompressedTasks, { to: 'string' });

        // FIXME: add schema validation
        return JSON.parse(decompressedTasks) as ValidateImageTask[];
    }, [compressedTasks]);

    const currentTask = taskList[currentTaskIndex] as ValidateImageTask | undefined;
    const maxTasks = taskList.length;

    // Per-project options, not the built-in answer palette: `iconColor` is whatever the
    // project author typed into Firebase, so it reaches the button as a raw colour and never
    // through constants/answers.
    const options = projectDetails.customOptions;

    const handleAnswerSelect = useCallback((newValue: number) => {
        if (isDefined(currentTask)) {
            onResultsChange((prevResults) => ({
                ...prevResults,
                [currentTask.taskId]: newValue,
            }));
        }

        const nextIndex = currentTaskIndex + 1;
        if (nextIndex < maxTasks) {
            setCurrentTaskIndex(nextIndex);
        } else if (!completedRef.current) {
            completedRef.current = true;
            onSessionComplete();
        }
    }, [currentTask, onResultsChange, maxTasks, currentTaskIndex, onSessionComplete]);

    const selectedValue = isDefined(currentTask)
        ? results[currentTask.taskId]
        : undefined;

    const handleIndexChange = useCallback((index: number) => {
        setCurrentTaskIndex(index);
    }, []);

    let totalSwipedTasks = 0;
    if (results) {
        totalSwipedTasks = Object.keys(results).length;
        if ('startTime' in results) {
            totalSwipedTasks -= 1;
        }
    }

    const limitedTasks = [...(taskList ?? [])].slice(0, totalSwipedTasks + 1);

    // After "Go back" from the outro the session re-mounts at the first task
    // with all answers intact; re-show the outro once the user swipes back to
    // the final task. (The initial pass completes via handleAnswerSelect.)
    useEffect(() => {
        if (
            maxTasks > 1
            && currentTaskIndex === maxTasks - 1
            && totalSwipedTasks >= maxTasks
            && !completedRef.current
        ) {
            completedRef.current = true;
            onSessionComplete();
        }
    }, [currentTaskIndex, maxTasks, totalSwipedTasks, onSessionComplete]);

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

    const selectTaskKey = useCallback(
        (_: ValidateImageTask, index: number) => index.toString(),
        [],
    );

    const renderTask = useCallback((task: ValidateImageTask, index: number) => (
        <ImageWrapper
            item={task}
            itemIndex={index}
            onImageLoadStart={handleImageLoadStart}
            onImageLoadEnd={handleImageLoadEnd}
            bbox={task.bbox}
        />
    ), [handleImageLoadStart, handleImageLoadEnd]);

    return (
        <Stack
            spacing="md"
            grow="fill"
        >
            {/* The pager measures its own slot and hands each page those numbers, which is
                what retires both the SCREEN_WIDTH this list paged by and the onLayout height
                it wrote into every item. */}
            <Pager
                sizeVariant="page"
                data={limitedTasks}
                keyExtractor={selectTaskKey}
                renderPage={renderTask}
                index={currentTaskIndex}
                onIndexChange={handleIndexChange}
            />
            <Row
                spacing="md"
                padding="sm"
                justify="center"
                align="stretch"
                wrap
            >
                {options?.map((option) => (
                    <IconButton
                        name={option.value}
                        key={option.value}
                        label={option.title}
                        accessibilityLabel={option.title}
                        onPress={handleAnswerSelect}
                        sizeVariant="lg"
                        // FIXME: No casting
                        iconName={option.icon as IconName}
                        backendSurfaceColor={option.iconColor}
                        selected={selectedValue === option.value}
                        disabled={disableOptions}
                        labelColorVariant="onBrand"
                    />
                ))}
            </Row>
            <ProgressBar
                progress={totalSwipedTasks / maxTasks}
                colorVariant="onBrand"
                accessibilityLabel="Session progress"
            />
        </Stack>
    );
}

export default ValidateImageMappingSession;
