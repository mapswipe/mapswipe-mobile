import { useCallback } from 'react';

import ButtonLayout, { type ButtonLayoutProps } from './ButtonLayout';

interface Props<NAME> extends Omit<ButtonLayoutProps, 'onPress'> {
    name: NAME;
    title?: string;
    onPress?: (name: NAME) => void;
}

function Button<const NAME>(props: Props<NAME>) {
    const {
        name,
        onPress,
        ...otherProps
    } = props;

    const handlePress = useCallback(() => {
        onPress?.(name);
    }, [name, onPress]);

    return (
        <ButtonLayout
            onPress={handlePress}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
        />
    );
}

export default Button;
