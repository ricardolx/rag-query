import {
  useContext,
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  signOut,
  onAuthStateChanged,
  User,
  signInAnonymously,
} from "firebase/auth";
import { auth } from "../../firebase/firebase";

type UserAuth = {
  googleSignIn: () => Promise<void>;
  logOut: () => void;
  user: User | null;
};

const AuthContext = createContext({} as UserAuth);

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<{ user: User | null; isAnon: boolean }>({
    user: null,
    isAnon: false,
  });

  const googleSignIn = useCallback(async () => {
    try {
      if (user === null) {
        await signInAnonymously(auth);
      }
    } catch (err) {
      console.warn(err);
    }
  }, [user]);

  const logOut = () => {
    signOut(auth);
  };

  useEffect(() => {
    const sub = onAuthStateChanged(auth, async currentUser => {
      if (currentUser !== null && !currentUser.isAnonymous) {
        setUser({ user: currentUser, isAnon: false });
      } else {
        setUser({ user: null, isAnon: true });
      }
    });

    return () => sub();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user?.user,
        logOut,
        googleSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
