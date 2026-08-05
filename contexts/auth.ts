import {
    createContext,
    Dispatch,
    SetStateAction,
} from 'react';
import { type User } from 'firebase/auth';

import { type FbUser } from '@/firebase/functions/generated/tsfirebase/extended_models';

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
  // The realtime-database profile at v2/users/{uid}; `teamId` lives here.
  userDetails: FbUser | undefined;
  userDetailsPending: boolean;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export default AuthContext;
