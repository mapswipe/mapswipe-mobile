import { Fragment } from 'react';
import {
    StyleSheet,
    Text as NativeText,
    View,
} from 'react-native';

import BlockListView from '@/components/BlockListView';
import Text from '@/components/Text';

const styles = StyleSheet.create({
    listItem: {
        flexDirection: 'row',
        gap: 6,
    },
    listItemText: {
        flex: 1,
    },
    bold: {
        fontWeight: 'bold',
    },
});

const LIST_ITEM_REGEX = /^\s*[-*•]\s+/;

// Renders **bold** text
function InlineMarkdown({ text }: { text: string }) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return (
        <>
            {parts.map((part, index) => (
                part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
                    // eslint-disable-next-line react/no-array-index-key
                    <NativeText key={index} style={styles.bold}>
                        {part.slice(2, -2)}
                    </NativeText>
                ) : (
                    // eslint-disable-next-line react/no-array-index-key
                    <Fragment key={index}>{part}</Fragment>
                )
            ))}
        </>
    );
}

interface Props {
    children: string | undefined;
}

// Minimal markdown for the release notes written in the backend:
// supports list items ("- item") and **bold** text
function MarkdownText(props: Props) {
    const { children } = props;

    const lines = (children ?? '')
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line.trim().length > 0);

    if (lines.length === 0) {
        return null;
    }

    return (
        <BlockListView spacing="3xs">
            {lines.map((line, index) => {
                const isListItem = LIST_ITEM_REGEX.test(line);
                if (!isListItem) {
                    return (
                        // eslint-disable-next-line react/no-array-index-key
                        <Text key={index}>
                            <InlineMarkdown text={line.trim()} />
                        </Text>
                    );
                }
                return (
                    // eslint-disable-next-line react/no-array-index-key
                    <View key={index} style={styles.listItem}>
                        <Text>•</Text>
                        <View style={styles.listItemText}>
                            <Text>
                                <InlineMarkdown text={line.replace(LIST_ITEM_REGEX, '')} />
                            </Text>
                        </View>
                    </View>
                );
            })}
        </BlockListView>
    );
}

export default MarkdownText;
