import {
    createContext,
    Dispatch,
    SetStateAction,
} from 'react';
import { type User } from 'firebase/auth';

export type AuthContextProps = (
  | {
      authPending: true;
      isLoggedIn: false;
      user: undefined;
    }
  | {
      authPending: false;
      isLoggedIn: false;
      user: null;
    }
  | {
      authPending: false;
      isLoggedIn: true;
      user: User;
    }
) & {
  setUser: Dispatch<SetStateAction<User | null | undefined>>;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export default AuthContext;
