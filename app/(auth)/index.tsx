import { useEffect } from 'react';
import { router } from 'expo-router';

function AuthIndex() {
    useEffect(() => {
        router.replace('/(auth)/(home)/projects');
    }, []);

    return null;
}

export default AuthIndex;
