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
  // The signed-in user's realtime-database profile (v2/users/{uid}), fetched once
  // at the auth layer so screens don't each refetch it. `teamId` lives here.
  userDetails: FbUser | undefined;
  userDetailsPending: boolean;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export default AuthContext;
