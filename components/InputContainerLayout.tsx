import {
    StyleSheet,
    Text,
} from 'react-native';
import {
    isFalsyString,
    isTruthyString,
} from '@togglecorp/fujs';

import BlockListView from './BlockListView';

const styles = StyleSheet.create({
    inputContainerLayout: {
        flexGrow: 1,
        backgroundColor: '#ffffff',
        padding: 14,
        borderRadius: 10,
    },
    label: {
        color: '#717171',
        textTransform: 'uppercase',
        fontSize: 10,
    },
    hint: {
        color: '#969696',
    },
    error: {
        color: '#e04653',
    },
});

interface Props {
    input: React.ReactNode;
    labelText?: string;
    errorText?: string;
    hintText?: string;
}

function InputContainerLayout(props: Props) {
    const {
        labelText,
        input,
        errorText,
        hintText,
    } = props;

    return (
        <BlockListView
            style={styles.inputContainerLayout}
            spacing="xs"
        >
            {isTruthyString(labelText) && (
                <Text style={styles.label}>
                    {labelText}
                </Text>
            )}
            {input}
            {isTruthyString(errorText) && (
                <Text style={styles.error}>
                    {errorText}
                </Text>
            )}
            {isFalsyString(errorText) && isTruthyString(hintText) && (
                <Text style={styles.hint}>
                    {hintText}
                </Text>
            )}
        </BlockListView>
    );
}

export default InputContainerLayout;
