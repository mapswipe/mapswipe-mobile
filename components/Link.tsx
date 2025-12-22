import { Link as ExpoLink, LinkProps } from 'expo-router';
import { Pressable } from 'react-native';
import Text from './Text';
import InlineListView from './InlineListView';
import { CaretRightIcon } from 'phosphor-react-native';

function Link(props: LinkProps) {
    const {
        children,
        ...otherProps
    } = props;

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
                        borderColor: 'blue',
                        borderWidth: 1,
                        borderRadius: 20,
                        flexShrink: 0,
                    }}
                    withPadding
                    withAdditionalInlinePadding
                    withoutOpticalCorrection
                >
                    <Text
                        style={{
                            color: 'blue',
                            textTransform: 'uppercase',
                        }}
                    >
                        {children}
                    </Text>
                    <CaretRightIcon
                        style={{
                            color: 'blue',
                        }}
                        size={14}
                    />
                </InlineListView>
            </Pressable>
        </ExpoLink>
    );
}

export default Link;


