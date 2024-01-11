"use client";
import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import { UserAuth } from "../context/auth";
import { functions, httpsCallable, firestore } from "../../firebase/firebase";
import { collection, doc, onSnapshot, query, where } from "firebase/firestore";
import { Loading } from "../components/Loading";
import { getFileContent } from "../../../functions/src/data";

interface Documents {
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
  console.log({ user });
  const [readyDocuments, setReadyDocuments] = useState<Documents[]>([]);
  const [questionAndAnswer, setQnA] = useState<QuestionAndAnswer>({});
  const [loading, setLoading] = useState<boolean>(false);

  // initial load
  useEffect(() => {
    if (!user || user.isAnonymous) {
      return;
    }
    const q = query(collection(firestore, "pages"));

    const sub = onSnapshot(q, snapshot => {
      console.log({ snapshot: snapshot.size });
      const readyDocuments: { id: string; content: string }[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        readyDocuments.push({ ...(data as any), id: doc.id });
      });
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

        const data = { question: questionAndAnswer.newQuestion?.trim() };

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
    [questionAndAnswer]
  );

  const formTitle = useMemo(() => {
    return <p className="text-gray-300">Ask a question</p>;
  }, [questionAndAnswer.answer]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    const buffer = await file?.arrayBuffer();
    const fileName = file?.name;
    if (file) {
      setLoading(true);
      try {
        const call = httpsCallable(functions, "uploadDocument");
        const data = { buffer, fileName };
        await call(data);
      } catch (e) {
        console.warn(e);
      }
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="flex flex-row h-10 w-11/12 ">
        <div className="w-4/12">
          <p className="mx-12">Documents</p>
          <ol className="mx-8 my-4"></ol>
        </div>
        <div className="flex flex-col h-96 w-full items-center justify-between bg-gray-900 rounded-lg p-5">
          {readyDocuments.length === 0 ? (
            <>
              <p>Upload a document</p>
              <input
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={handleFileUpload}
              />
            </>
          ) : (
            <>
              {formTitle}
              <div>
                {questionAndAnswer.answer && (
                  <div>
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
                  placeholder={"Ask something"}
                />
                <button
                  type="submit"
                  className="ml-5 border-2 border-sky-500 rounded-lg p-2 px-4"
                >
                  Ask
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
