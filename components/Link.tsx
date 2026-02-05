import { Pressable } from 'react-native';
import {
    Link as ExpoLink,
    LinkProps,
} from 'expo-router';
import { CaretRightIcon } from 'phosphor-react-native';

import { FONT_SIZE_MD } from '@/constants/dimensions';
import useTheme from '@/hooks/useTheme';
import { SpacingType } from '@/utils/styles';

import InlineListView from './InlineListView';
import Text from './Text';

interface Props extends LinkProps {
    withForwardIcon?: boolean;
    withoutAdditionalPaddding?: boolean;
    spacing?: SpacingType;
}

function Link(props: Props) {
    const {
        withForwardIcon,
        children,
        withoutAdditionalPaddding,
        spacing,
        ...otherProps
    } = props;

    const theme = useTheme();

    return (
        <ExpoLink
            asChild
            {...otherProps}
        >
            <Pressable>
                <InlineListView
                    spacing={spacing}
                    spacingOffset={-4}
                    withCenteredContent
                    style={{
                        borderColor: theme.primaryDark,
                        backgroundColor: theme.primary,
                        borderWidth: 1,
                        borderRadius: 20,
                        flexShrink: 0,
                        flexGrow: 0,
                    }}
                    withPadding
                    withAdditionalInlinePadding={!withoutAdditionalPaddding}
                    withoutOpticalCorrection
                >
                    {typeof children === 'string' && (
                        <Text
                            style={{
                                color: theme.textOnPrimary,
                                textTransform: 'uppercase',
                            }}
                        >
                            {children}
                        </Text>
                    )}
                    {typeof children !== 'string' && children}
                    {withForwardIcon && (
                        <CaretRightIcon
                            style={{
                                color: theme.textOnPrimary,
                            }}
                            size={FONT_SIZE_MD}
                        />
                    )}
                </InlineListView>
            </Pressable>
        </ExpoLink>
    );
}

export default Link;
