import { useEffect } from 'react';
import { router } from 'expo-router';

function HomeIndex() {
    useEffect(() => {
        router.push('/projects');
    }, []);

    return null;
}

export default HomeIndex;
