import { isNotDefined } from "@togglecorp/fujs";
import {
    CheckIcon,
    MinusIcon,
    XIcon,
    type IconProps,
    type Icon as PhosphorIcon,
} from "phosphor-react-native";

type IconName = 'add-outline'
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
| 'tap'
| 'tap-1'
| 'tap-2'
| 'tap-3'
| 'thumbs-down-outline'
| 'thumbs-up-outline'
| 'triangle-outline'
| 'warning-outline';

const iconMap: Record<IconName, PhosphorIcon> = {
    'checkmark-outline': CheckIcon,
    'close-outline': XIcon,
    'remove-outline': MinusIcon,
}

interface Props extends IconProps {
    name: string;
}

function Icon(props: Props) {
    const {
        name: nameFromProps,
        ...phosphorIconProps
    } = props;

    const name = nameFromProps as IconName;

    const IconComponent = iconMap[name];

    if (isNotDefined(IconComponent)) {
        return null;
    }

    return <IconComponent {...phosphorIconProps} />;
}

export default Icon;
