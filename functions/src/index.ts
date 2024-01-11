/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall } from "firebase-functions/v2/https";
import { getFileContent } from "./data";
import OpenAI from "openai";
import {
  getVectorEmbedding,
  insertEmbedding,
  queryVectorIndex,
} from "./vector";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

initializeApp();
const firestore = getFirestore();

exports.uploadDocument = onCall(
  {
    timeoutSeconds: 60,
    memory: "1GiB",
  },
  async context => {
    const { buffer: base64String } = context.data;
    const buffer = Buffer.from(base64String, "base64");

    const fileContent = await getFileContent(Buffer.from(buffer));

    fileContent.forEach(async content => {
      // Insert the page into firestore
      const firestoreDocument = await firestore
        .collection("pages")
        .add({ content });

      // get the page embedding from OpenAI
      const embedding = await getVectorEmbedding(content);

      await firestore
        .collection("embeddings")
        .doc(firestoreDocument.id)
        .set({ embedding });

      // insert the page embedding into Pinecone,
      // mapped to the firestore document id
      await insertEmbedding(firestoreDocument.id, embedding);
    });

    return;
  }
);

exports.questionDocument = onCall(async context => {
  const { question } = context.data;

  const id = await queryVectorIndex(question);

  const doc = await firestore.collection("pages").doc(id).get();

  const prompt = `Given a document, answer a question about the document
    Do not include any other information. Only include the information that is
    in the document in the answer. If there is a question that 
    cannot be answered, please say that there isn't enough information.
    The slide content may not be discernable. If that is the case 
    then ignore it and focus on the notes.
    
    Document: ${doc.data()?.content}

    Question: ${question}`;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
  });

  const response = await openai.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt,
    temperature: 0.3,
    stream: false,
    max_tokens: 1000,
  });

  const answer = response.choices[0].text;

  return { answer, question };
});
