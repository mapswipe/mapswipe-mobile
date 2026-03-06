import { useEffect } from 'react';
import { router } from 'expo-router';

function HomeIndex() {
    useEffect(() => {
        router.replace('/projects');
    }, []);

    return null;
}

export default HomeIndex;
