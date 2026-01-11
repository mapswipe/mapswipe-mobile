import { Link as ExpoLink, LinkProps } from 'expo-router';
import { Pressable } from 'react-native';
import Text from './Text';
import InlineListView from './InlineListView';
import { CaretRightIcon } from 'phosphor-react-native';
import useTheme from '@/hooks/useTheme';
import { FONT_SIZE_MD } from '@/constants/dimensions';

function Link(props: LinkProps) {
    const {
        children,
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
                    spacing="3xs"
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
                    withAdditionalInlinePadding
                    withoutOpticalCorrection
                >
                    <Text
                        style={{
                            color: theme.textOnPrimary,
                            textTransform: 'uppercase',
                        }}
                    >
                        {children}
                    </Text>
                    <CaretRightIcon
                        style={{
                            color: theme.textOnPrimary,
                        }}
                        size={FONT_SIZE_MD}
                    />
                </InlineListView>
            </Pressable>
        </ExpoLink>
    );
}

export default Link;


