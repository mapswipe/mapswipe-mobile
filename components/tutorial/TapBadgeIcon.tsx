import {
    StyleSheet,
    View,
} from 'react-native';

import Icon, { type IconName } from '@/components/Icon';
import Text from '@/components/Text';

const ICON_SIZE = 40;
const BADGE_SIZE = 18;

const styles = StyleSheet.create({
    wrapper: {
        width: ICON_SIZE,
        height: ICON_SIZE,
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -2,
        right: -4,
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        borderRadius: BADGE_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#FFFFFF',
        lineHeight: BADGE_SIZE,
    },
});

interface Props {
    iconName?: IconName;
    badgeNumber?: number;
    badgeColor?: string;
}

function TapBadgeIcon(props: Props) {
    const {
        iconName = 'tap',
        badgeNumber,
        badgeColor,
    } = props;

    return (
        <View style={styles.wrapper}>
            <Icon
                name={iconName}
                color="#FFFFFF"
                size={ICON_SIZE}
            />
            {badgeNumber && badgeColor && (
                <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                    <Text style={styles.badgeText}>{String(badgeNumber)}</Text>
                </View>
            )}
        </View>
    );
}

export default TapBadgeIcon;
