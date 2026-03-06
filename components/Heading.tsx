import {
    StyleSheet,
    Text,
} from 'react-native';

interface Props {
    text: string;
}

const styles = StyleSheet.create({
    heading: {
        fontSize: 16,
        fontWeight: 600,
    },
});

function Heading(props: Props) {
    const { text } = props;

    return (
        <Text style={styles.heading}>
            {text}
        </Text>
    );
}

export default Heading;
