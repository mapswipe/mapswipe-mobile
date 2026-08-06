import { useCallback } from 'react';
import { isDefined } from '@togglecorp/fujs';

import ListView from '@/components/ui/ListView';
import Media from '@/components/ui/Media';
import Text from '@/components/ui/Text';
import { FbInformationPage } from '@/utils/types';

// utils/types re-exports the page but not its block, so the row type is read off the page.
type InformationBlock = NonNullable<FbInformationPage['blocks']>[number];

interface Props {
    page: FbInformationPage;
}

function TutorialInformationPage(props: Props) {
    const { page } = props;

    const selectBlockKey = useCallback(
        (block: InformationBlock) => String(block.blockNumber),
        [],
    );

    const renderBlock = useCallback((block: InformationBlock) => {
        if (isDefined(block.textDescription)) {
            return (
                <Text colorVariant="onBrand">
                    {block.textDescription}
                </Text>
            );
        }
        if (isDefined(block.image)) {
            return (
                <Media
                    source={block.image}
                    sizeVariant="illustration"
                    styleVariant="rounded"
                    withoutAccessibilityLabel
                />
            );
        }
        return null;
    }, []);

    return (
        <ListView
            data={page.blocks}
            keySelector={selectBlockKey}
            renderItem={renderBlock}
            spacing="sm"
            padding="sm"
            grow="slot"
            header={(
                <Text variant="title" colorVariant="onBrand">
                    {page.title}
                </Text>
            )}
        />
    );
}

export default TutorialInformationPage;
