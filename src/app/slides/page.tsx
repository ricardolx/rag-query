"use client";
import React, { use, useCallback, useEffect, useState } from "react";
import { UserAuth } from "../context/auth";
import { functions, httpsCallable, firestore } from "../../firebase/firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

const Page: React.FC = () => {
  const { user, accessToken } = UserAuth();
  const [presentations, setPresentations] = useState<string[]>([]);

  // initial load
  useEffect(() => {
    if (!user || user.isAnonymous) {
      return;
    }
    const fetchSlides = async () => {
      try {
        const call = httpsCallable(functions, "getSlides");

        await call({ access_token: accessToken });
      } catch (err) {
        console.warn(err);
      }
    };
    fetchSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accessToken]);

  useEffect(() => {
    console.log({ user });
    if (!user || user.isAnonymous) {
      return;
    }
    console.log(user.email);
    const q = query(
      collection(firestore, "Presentations"),
      where("uid", "==", user.uid)
    );

    const sub = onSnapshot(q, snapshot => {
      console.log({ snapshot });
      const presentations: string[] = [];
      snapshot.forEach(doc => {
        console.log(doc.data());
        presentations.push(doc.data().title);
      });
      setPresentations(presentations);
    });

    return () => sub();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      {presentations.length === 0 && (
        <div className="items-center ">
          <div className="lds-ellipsis">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}
      <ol className="p-12">
        {presentations.map((p, i) => (
          <li key={p + i}>{p}</li>
        ))}
      </ol>
    </div>
  );
};

export default Page;
