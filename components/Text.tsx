import { Text as NativeText } from 'react-native';
import { TextStyle } from 'react-native';

interface Props {
    children: React.ReactNode;
    style?: TextStyle;
}

function Text(props: Props) {
    const {
        style,
        children,
    } = props;

    return (
        <NativeText style={style}>
            {children}
        </NativeText>
    );
}

export default Text;
