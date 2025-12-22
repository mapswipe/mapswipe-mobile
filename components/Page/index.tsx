import { Text, View, StyleSheet } from "react-native";
import BlockListView from "../BlockListView";
import { SafeAreaView } from "react-native-safe-area-context";

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: '#f4f4f6',
    },
});

interface Props {
    title: string;
    children: React.ReactNode;
    withFullWidthContent?: boolean;
}

function Page(props: Props) {
    const {
        title,
        children,
        withFullWidthContent,
    } = props;

    return (
        <SafeAreaView style={styles.page}>
            {children}
        </SafeAreaView>
    );
}

export default Page;
