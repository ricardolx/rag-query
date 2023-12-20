"use client";
import React, { use, useCallback, useEffect, useState } from "react";
import { UserAuth } from "../context/auth";
import { functions, httpsCallable, firestore } from "../../firebase/firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";

interface Presentation {
  id: string;
  title: string;
}
interface QuestionAndAnswer {
  question?: string;
  answer?: string;
}

const Page: React.FC = () => {
  const { user, accessToken } = UserAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] = useState<
    Presentation | undefined
  >();
  const [question, setQuestion] = useState<QuestionAndAnswer>({});

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

  const submitQuestion = useCallback(async () => {
    try {
      const call = httpsCallable(functions, "questionDocument");
      const id = selectedPresentation?.id ?? "NONE";

      const data = { id, question: question.question };

      const response = await call(data);

      const responseData = response.data as any;
      const answer = responseData.answer;
      if (!answer) {
        setQuestion({
          question: undefined,
          answer: "Unable to resolve an answer",
        });
      } else {
        setQuestion({
          question: undefined,
          answer,
        });
      }
    } catch (err) {
      console.warn(err);

      setQuestion({
        question: undefined,
        answer: "An error ocurred: Unable to retrieve an answer",
      });
    }
  }, [accessToken, question, selectedPresentation]);

  useEffect(() => {
    console.log({ selectedPresentation });
  }, [selectedPresentation]);

  const toggleSelectedPresentation = useCallback(
    (p: Presentation) => {
      if (selectedPresentation?.id === p.id) {
        setSelectedPresentation(undefined);
      } else {
        setSelectedPresentation(p);
      }
    },
    [selectedPresentation, setSelectedPresentation]
  );

  const presentationName = useCallback(
    (p: Presentation, i: number) => {
      const textColor =
        selectedPresentation?.id === p.id ? "text-white" : "text-gray-600";
      return (
        <li
          onClick={() => toggleSelectedPresentation(p)}
          key={p.title + i}
          className={`${textColor}`}
        >
          {p.title}
        </li>
      );
    },
    [selectedPresentation]
  );

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
      <div className="flex flex-row h-10 w-11/12 ">
        <div className="w-4/12">
          <ol className="p-12">
            {presentations.map((p, i) => (
              <div key={p.id + p.title}>{presentationName(p, i)}</div>
            ))}
          </ol>
        </div>
        <div className="flex flex-col h-96 w-full items-center justify-between">
          {selectedPresentation === undefined ? (
            <div>Ask a question</div>
          ) : (
            <div>
              <p>{`Ask a question about ${selectedPresentation?.title}`}</p>
            </div>
          )}
          <div>
            {question.answer && (
              <p className="text-gray-400">{question.answer}</p>
            )}
          </div>
          <div
            className="w-full items-center justify-center flex"
            // onSubmit={submitQuestion}
          >
            <input
              value={question.question || ""}
              onChange={e => setQuestion({ question: e.target.value })}
              className="p-2 rounded-lg text-black w-4/5"
              onSubmit={submitQuestion}
              required={true}
            />
            <button type="submit" className="pl-5" onClick={submitQuestion}>
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
