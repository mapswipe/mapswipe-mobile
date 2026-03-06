import { createContext } from 'react';
import { type User } from 'firebase/auth';

export type AuthContextProps = {
    authPending: true;
    isLoggedIn: false;
    user: undefined;
} | {
    authPending: false;
    isLoggedIn: false;
    user: null;
} | {
    authPending: false;
    isLoggedIn: true;
    user: User;
}

const AuthContext = createContext<AuthContextProps>({
    authPending: true,
    isLoggedIn: false,
    user: undefined,
});

export default AuthContext;
