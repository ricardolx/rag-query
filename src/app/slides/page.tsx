"use client";
import React, { use, useCallback, useEffect, useState } from "react";
import { UserAuth } from "../context/auth";
import { functions, httpsCallable, firestore } from "../../firebase/firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

const Page: React.FC = () => {
  const { user, accessToken } = UserAuth();
  const [presentations, setPresentations] = useState<string[]>([]);

  const fetchSlides = useCallback(async () => {
    try {
      const call = httpsCallable(functions, "getSlides");

      await call({ access_token: accessToken });
    } catch (err) {
      console.warn(err);
    }
  }, [user, accessToken]);

  // initial load
  useEffect(() => {
    fetchSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = query(
      collection(firestore, "presentations"),
      where("uid", "==", user?.uid)
    );

    const sub = onSnapshot(q, snapshot => {
      const presentations: string[] = [];
      snapshot.forEach(doc => {
        presentations.push(doc.data().presentationId);
      });
      setPresentations(presentations);
    });

    return () => sub();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>This is the slides page</h1>
      <div className="p-12">
        {presentations.map(p => (
          <p>{p}</p>
        ))}
      </div>
    </div>
  );
};

export default Page;
