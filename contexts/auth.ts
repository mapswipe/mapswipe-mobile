import { type User } from 'firebase/auth';
import { createContext } from 'react';

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
