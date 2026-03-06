import {
    Link as ExpoLink,
    LinkProps,
} from 'expo-router';

import ButtonLayout, { type ButtonLayoutProps } from './ButtonLayout';

type Props = LinkProps & ButtonLayoutProps;

function Link(props: Props) {
    const {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onPress,
        children,
        colorVariant,
        styleVariant,
        disabled,
        title,
        fullWidth = false,
        iconName,
        href,
        ...otherProps
    } = props;

    return (
        <ExpoLink
            asChild
            disabled={disabled}
            href={href}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...otherProps}
        >
            <ButtonLayout
                colorVariant={colorVariant}
                styleVariant={styleVariant}
                disabled={disabled}
                title={title}
                fullWidth={fullWidth}
                iconName={iconName}
            >
                {children}
            </ButtonLayout>
        </ExpoLink>
    );
}

export default Link;
