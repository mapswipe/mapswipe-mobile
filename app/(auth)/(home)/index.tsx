import { router } from "expo-router";
import { useEffect } from "react";

function HomeIndex() {
    useEffect(() => {
        router.replace('/projects');
    }, [])

    return null;
}

export default HomeIndex;
