import {
  useContext,
  createContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  signInWithCustomToken,
  signInAnonymously,
} from "firebase/auth";
import { auth } from "../../firebase/firebase";

type UserAuth = {
  googleSignIn: () => Promise<void>;
  logOut: () => void;
  user: User | null;
  signInWithToken: (token: string) => void;
  accessToken: string;
  setAccessToken: (token: string) => void;
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
  const [accessToken, setAccessToken] = useState<string>("");

  const googleSignIn = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.warn(err);
    }
  };

  const logOut = () => {
    signOut(auth);
  };

  const signInWithToken = async (token: string) => {
    await signInWithCustomToken(auth, token);
  };

  useEffect(() => {
    const sub = onAuthStateChanged(auth, async currentUser => {
      console.log({ currentUser });
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
        signInWithToken,
        accessToken,
        setAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
