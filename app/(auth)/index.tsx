import { router } from "expo-router";
import { useEffect } from "react";

function AuthIndex() {
    useEffect(() => {
        router.replace('/home/projects');
    }, []);

    return null;
}

export default AuthIndex;
