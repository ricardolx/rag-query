import Link from "next/link";
import React, { useEffect } from "react";
import { UserAuth } from "../context/auth";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  auth,
  signInWithPopup,
} from "../../firebase/firebase";

const Navbar = () => {
  const { user, logOut, googleSignIn } = UserAuth();

  const router = useRouter();

  useEffect(() => {
    googleSignIn();
  }, []);

  useEffect(() => {
    if (user === null) {
      if (window.location.pathname !== "/") {
        router.push("/");
      }
    } else {
      router.push("/document");
    }
  }, [router, user]);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      const credential = GoogleAuthProvider.credentialFromError(err);
    }
  };
  const handleLogOut = async () => {
    try {
      logOut();
    } catch (err) {
      console.warn(err);
    }
  };
  return (
    <div className="h-10 w-full item flex justify-end p-5">
      <ul className="flex">
        <li className="p-2">
          <Link href="/">Home</Link>
        </li>
        {user !== null ? (
          <>
            <li className="p-2">
              <Link href="/slides">Slides</Link>
            </li>
            <li className="p-2">
              <button onClick={handleLogOut}>Log out</button>
            </li>
          </>
        ) : (
          <li className="p-2">
            <button onClick={handleSignIn}>Login</button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default Navbar;
