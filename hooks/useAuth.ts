import { useContext } from 'react';

import AuthContext from '@/contexts/auth';

function useAuth() {
    const auth = useContext(AuthContext);

    return auth;
}

export default useAuth;
