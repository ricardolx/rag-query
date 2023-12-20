"use client";
import React, { use, useCallback, useEffect, useState } from "react";
import { UserAuth } from "../context/auth";
import { functions, httpsCallable, firestore } from "../../firebase/firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

interface Presentation {
  id: string;
  title: string;
}

const Page: React.FC = () => {
  const { user, accessToken } = UserAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] = useState<
    Presentation | undefined
  >();
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");

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
      const presentations: { id: string; title: string }[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        presentations.push({ ...(data as any), id: doc.id });
      });
      setPresentations(presentations);
    });

    return () => sub();
  }, [user]);

  const queryVector = useCallback(
    async (id: string) => {
      try {
        const call = httpsCallable(functions, "questionDocument");

        const response = await call({ id, question });
        const data = response.data as any;
        const answer = data.answer;
        if (!answer) {
          setAnswer("Unable to resolve an answer");
        } else {
          setAnswer(answer);
        }
      } catch (err) {
        console.warn(err);
        setAnswer("An error ocurred: Unable to retrieve an answer");
      }
    },
    [accessToken, question]
  );

  useEffect(() => {
    console.log({ selectedPresentation });
  }, [selectedPresentation]);

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
      <div className="flex flex-row h-10 justify-between align-around">
        <div>
          <ol className="p-12">
            {presentations.map((p, i) => (
              <li onClick={() => setSelectedPresentation(p)} key={p.title + i}>
                {p.title}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col">
          {selectedPresentation === undefined ? (
            <div>Select a presentation to ask a question</div>
          ) : (
            <div>
              <p>{`Ask a question about ${selectedPresentation?.title}`}</p>
            </div>
          )}
          <>{answer && <div>{answer}</div>}</>
          <div className="">
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              className="p-2 rounded-lg text-black"
            />
            <button
              className="pl-5"
              disabled={!selectedPresentation}
              onClick={() => {
                queryVector(selectedPresentation!.id);
              }}
            >
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
