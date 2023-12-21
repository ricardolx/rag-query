"use client";
import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { UserAuth } from "../context/auth";
import { functions, httpsCallable, firestore } from "../../firebase/firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Loading } from "../components/Loading";

interface Presentation {
  id: string;
  title: string;
}
interface QuestionAndAnswer {
  newQuestion?: string;
  answer?: {
    answer: string;
    question: string;
    title?: string;
  };
}

const Page: React.FC = () => {
  const { user } = UserAuth();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedPresentation, setSelectedPresentation] = useState<
    Presentation | undefined
  >();
  const [questionAndAnswer, setQnA] = useState<QuestionAndAnswer>({});
  const [loading, setLoading] = useState<boolean>(false);

  // initial load
  useEffect(() => {
    if (!user || user.isAnonymous) {
      return;
    }
    const fetchSlides = async () => {
      try {
        const call = httpsCallable(functions, "getSlides");

        await call();
      } catch (err) {
        console.warn(err);
      }
    };
    fetchSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
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

  const submitQuestion = useCallback(
    async (event: { preventDefault: () => void }) => {
      event?.preventDefault();
      try {
        if (
          questionAndAnswer.newQuestion === undefined ||
          questionAndAnswer.newQuestion.trim() === ""
        ) {
          return;
        }
        setLoading(true);
        const call = httpsCallable(functions, "questionDocument");
        const id = selectedPresentation?.id ?? "NONE";

        const data = { id, question: questionAndAnswer.newQuestion?.trim() };

        const response = await call(data);

        const answer = response.data as any;
        if (!answer) {
          setQnA({
            newQuestion: undefined,
            answer: {
              question: "",
              answer: "Unable to resolve an answer",
            },
          });
        } else {
          setQnA({
            newQuestion: undefined,
            answer,
          });
        }
      } catch (err) {
        console.warn(err);

        setQnA({
          newQuestion: undefined,
          answer: {
            question: "",
            answer: "An error ocurred: Unable to retrieve an answer",
          },
        });
      }
      setLoading(false);
    },
    [questionAndAnswer, selectedPresentation]
  );

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
          className={`${textColor} dark:md:hover:text-gray-300`}
        >
          {p.title}
        </li>
      );
    },
    [selectedPresentation]
  );

  const formTitle = useMemo(() => {
    if (questionAndAnswer.answer !== undefined) {
      return (
        <p className="text-gray-300">{`Q: ${questionAndAnswer.answer.question}`}</p>
      );
    }
    return selectedPresentation === undefined ? (
      <p className="text-gray-300">Ask a question</p>
    ) : (
      <p className="text-gray-300">{`Ask a question about ${selectedPresentation?.title}`}</p>
    );
  }, [selectedPresentation, questionAndAnswer.answer]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      {presentations.length === 0 && <Loading />}
      <div className="flex flex-row h-10 w-11/12 ">
        <div className="w-4/12">
          <p className="mx-12">Presentations</p>
          <ol className="mx-8 my-4">
            {presentations.map((p, i) => (
              <div
                key={p.id + p.title}
                className="rounded-lg px-2 md:hover:cursor-pointer md:hover:bg-gray-900"
              >
                {presentationName(p, i)}
              </div>
            ))}
          </ol>
        </div>
        <div className="flex flex-col h-96 w-full items-center justify-between bg-gray-900 rounded-lg p-5">
          {formTitle}
          <div>
            {questionAndAnswer.answer && (
              <div>
                {(selectedPresentation === undefined ||
                  selectedPresentation.title !==
                    questionAndAnswer.answer.title) && (
                  <p className="text-gray-600 mx-8 my-2">{`From: ${questionAndAnswer.answer.title}`}</p>
                )}
                <p className="text-gray-100 mx-8 my-2">
                  {questionAndAnswer.answer.answer}
                </p>
              </div>
            )}
            {loading && <Loading />}
          </div>
          <form
            className="w-full items-center justify-center flex"
            onSubmit={submitQuestion}
          >
            <input
              value={questionAndAnswer.newQuestion || ""}
              onChange={e => setQnA({ newQuestion: e.target.value })}
              className="p-2 rounded-lg text-black w-4/5"
              onSubmit={submitQuestion}
              required={true}
              placeholder={
                !selectedPresentation
                  ? "Ask something about any presentation..."
                  : `Ask something about ${selectedPresentation?.title}...`
              }
            />
            <button
              type="submit"
              className="ml-5 border-2 border-sky-500 rounded-lg p-2 px-4"
            >
              Ask
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Page;
