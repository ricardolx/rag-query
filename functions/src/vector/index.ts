import { Pinecone } from "@pinecone-database/pinecone";
import * as logger from "firebase-functions/logger";
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_KEY ?? "",
  environment: process.env.PINECONE_ENVIRONMENT ?? "",
});

export const getEmbeddingVector = async (text: string) => {
  const result = await openai.embeddings.create({
    input: text,
    model: process.env.VECTOR_MODEL ?? "text-embedding-ada-002",
  });
  return result.data[0].embedding;
};

export const insertEmbedding = async (id: string, values: number[]) => {
  await pinecone
    .index(process.env.PINECONE_DOCUMENT_INDEX ?? "")
    .upsert([{ id, values }]);
  logger.log("Inserted to Pinecone", id);
};
