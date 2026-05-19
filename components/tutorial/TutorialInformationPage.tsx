import {
    ScrollView,
    StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { isDefined } from '@togglecorp/fujs';

import BlockListView from '@/components/BlockListView';
import Text from '@/components/Text';
import {
    IMAGE_SIZE_MD,
    SPACING_2XS,
    SPACING_SM,
} from '@/constants/dimensions';
import { FbInformationPage } from '@/utils/types';

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    content: {
        padding: SPACING_SM,
        gap: SPACING_2XS,
    },
    image: {
        width: '100%',
        height: IMAGE_SIZE_MD,
        borderRadius: 8,
    },
});

interface Props {
    page: FbInformationPage;
}

function TutorialInformationPage(props: Props) {
    const { page } = props;

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            <Text variant="title" colorVariant="brand">
                {page.title}
            </Text>
            <BlockListView spacing="sm">
                {page.blocks?.map((block) => {
                    if (isDefined(block.textDescription)) {
                        return (
                            <Text key={block.blockNumber} colorVariant="brand">
                                {block.textDescription}
                            </Text>
                        );
                    }
                    if (isDefined(block.image)) {
                        return (
                            <Image
                                key={block.blockNumber}
                                style={styles.image}
                                source={block.image}
                            />
                        );
                    }
                    return null;
                })}
            </BlockListView>
        </ScrollView>
    );
}

export default TutorialInformationPage;
