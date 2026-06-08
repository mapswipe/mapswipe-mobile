import { isNotDefined } from '@togglecorp/fujs';
import {
    ArrowClockwiseIcon,
    CaretLeftIcon,
    CaretRightIcon,
    CheckIcon,
    CircleIcon,
    CubeIcon,
    EggIcon,
    EyeIcon,
    EyeSlashIcon,
    FlagIcon,
    GlobeIcon,
    HandIcon,
    HandSwipeLeftIcon,
    HandSwipeRightIcon,
    HandTapIcon,
    HeartIcon,
    type Icon as PhosphorIcon,
    type IconProps,
    InfoIcon,
    MagnifyingGlassIcon,
    MinusIcon,
    PlusIcon,
    ProhibitIcon,
    QuestionIcon,
    ShapesIcon,
    SignOutIcon,
    SmileyIcon,
    SmileySadIcon,
    SquareIcon,
    StarIcon,
    ThumbsDownIcon,
    ThumbsUpIcon,
    TriangleIcon,
    WarningIcon,
    XIcon,
} from 'phosphor-react-native';

export type IconName =
    | 'add-outline'
    | 'alert-outline'
    | 'ban-outline'
    | 'check'
    | 'checkmark-outline'
    | 'close-outline'
    | 'egg-outline'
    | 'ellipse-outline'
    | 'flag-outline'
    | 'general-tap'
    | 'hand-left-outline'
    | 'hand-right-outline'
    | 'happy-outline'
    | 'heart-outline'
    | 'information-outline'
    | 'prism-outline'
    | 'refresh-outline'
    | 'remove-outline'
    | 'sad-outline'
    | 'search-outline'
    | 'shapes-outline'
    | 'square-outline'
    | 'star-outline'
    | 'swipe-left'
    | 'swipe-right'
    | 'tap'
    | 'tap-1'
    | 'tap-2'
    | 'tap-3'
    | 'thumbs-down-outline'
    | 'thumbs-up-outline'
    | 'triangle-outline'
    | 'caret-right'
    | 'caret-left'
    | 'sign-out'
    | 'globe'
    | 'warning-outline'
    | 'eye-closed'
    | 'eye'
    | 'question-mark'

const iconMap: Record<IconName, PhosphorIcon> = {
    'add-outline': PlusIcon,
    'alert-outline': WarningIcon,
    'ban-outline': ProhibitIcon,
    check: CheckIcon,
    'checkmark-outline': CheckIcon,
    'close-outline': XIcon,
    'egg-outline': EggIcon,
    'ellipse-outline': CircleIcon,
    'flag-outline': FlagIcon,
    // FIXME: these icons should be updated
    'general-tap': HandTapIcon,
    'hand-left-outline': HandIcon,
    'hand-right-outline': HandIcon,
    'happy-outline': SmileyIcon,
    'heart-outline': HeartIcon,
    'information-outline': InfoIcon,
    'prism-outline': CubeIcon,
    'refresh-outline': ArrowClockwiseIcon,
    'remove-outline': MinusIcon,
    'sad-outline': SmileySadIcon,
    'search-outline': MagnifyingGlassIcon,
    'shapes-outline': ShapesIcon,
    'square-outline': SquareIcon,
    'star-outline': StarIcon,
    'swipe-left': HandSwipeLeftIcon,
    'swipe-right': HandSwipeRightIcon,
    // FIXME: these icons should be updated
    tap: HandTapIcon,
    'tap-1': HandTapIcon,
    'tap-2': HandTapIcon,
    'tap-3': HandTapIcon,
    'thumbs-down-outline': ThumbsDownIcon,
    'thumbs-up-outline': ThumbsUpIcon,
    'triangle-outline': TriangleIcon,
    'warning-outline': WarningIcon,
    'caret-right': CaretRightIcon,
    'caret-left': CaretLeftIcon,
    'sign-out': SignOutIcon,
    globe: GlobeIcon,
    'eye-closed': EyeSlashIcon,
    eye: EyeIcon,
    'question-mark': QuestionIcon,
};

interface Props extends IconProps {
    name: IconName;
}

function Icon(props: Props) {
    const {
        name: nameFromProps,
        ...phosphorIconProps
    } = props;

    const name = nameFromProps;

    const IconComponent = iconMap[name];

    if (isNotDefined(IconComponent)) {
        return null;
    }

    // eslint-disable-next-line react/jsx-props-no-spreading
    return <IconComponent {...phosphorIconProps} />;
}

export default Icon;
