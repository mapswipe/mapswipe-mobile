import { useEffect } from 'react';
import { router } from 'expo-router';

function AuthIndex() {
    useEffect(() => {
        router.push('/(auth)/(home)/projects');
    }, []);

    return null;
}

export default AuthIndex;
