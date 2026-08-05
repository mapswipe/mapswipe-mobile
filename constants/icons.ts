/**
 * The glyph table: every icon name the app draws, and the phosphor component behind it.
 *
 * It lives in constants/ because components/ui/** may import tokens but not reach down into
 * components/**, and ui/Badge and ui/Checkbox need the raw component rather than ui/Icon: a badge
 * glyph pairs with its own fill through `onSurface`, which ui/Icon has no way to express.
 */
import {
    ArrowClockwiseIcon,
    ArrowLeftIcon,
    BuildingsIcon,
    CaretLeftIcon,
    CaretRightIcon,
    CheckIcon,
    CircleIcon,
    ClockIcon,
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
    InfoIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    MinusIcon,
    PlusIcon,
    ProhibitIcon,
    QuestionIcon,
    SelectionIcon,
    ShapesIcon,
    SignOutIcon,
    SmileyIcon,
    SmileySadIcon,
    SquareIcon,
    StarIcon,
    ThumbsDownIcon,
    ThumbsUpIcon,
    TriangleIcon,
    UserIcon,
    WarningIcon,
    XIcon,
} from 'phosphor-react-native';

export type IconName =
    | 'add-outline'
    | 'alert-outline'
    | 'ban-outline'
    | 'buildings'
    | 'map-pin'
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
    | 'time-outline'
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
    | 'arrow-left'
    | 'caret-left'
    | 'sign-out'
    | 'globe'
    | 'warning-outline'
    | 'eye-closed'
    | 'eye'
    | 'question-mark'
    | 'selection'
    | 'user'

export const ICON_GLYPH: Record<IconName, PhosphorIcon> = {
    'add-outline': PlusIcon,
    'alert-outline': WarningIcon,
    'ban-outline': ProhibitIcon,
    buildings: BuildingsIcon,
    'map-pin': MapPinIcon,
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
    'time-outline': ClockIcon,
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
    'arrow-left': ArrowLeftIcon,
    'caret-left': CaretLeftIcon,
    'sign-out': SignOutIcon,
    globe: GlobeIcon,
    'eye-closed': EyeSlashIcon,
    eye: EyeIcon,
    'question-mark': QuestionIcon,
    selection: SelectionIcon,
    user: UserIcon,
};
