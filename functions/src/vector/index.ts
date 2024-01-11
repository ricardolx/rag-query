import { Pinecone } from "@pinecone-database/pinecone";
import * as logger from "firebase-functions/logger";
import OpenAI from "openai";

export const getVectorEmbedding = async (text: string) => {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY,
  });

  try {
    const result = await openai.embeddings.create({
      input: text,
      model: process.env.VECTOR_MODEL ?? "text-embedding-ada-002",
    });
    return result.data[0].embedding;
  } catch (error) {
    logger.warn("error getting embedding vector", error);
    throw error;
  }
};

export const insertEmbedding = async (id: string, values: number[]) => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  await pinecone
    .index(process.env.PINECONE_DOCUMENT_INDEX ?? "")
    .upsert([{ id, values }]);
  logger.log("Inserted to Pinecone", id);
};

export const queryVectorIndex = async (query: string) => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  const index = pinecone.index(process.env.PINECONE_DOCUMENT_INDEX ?? "");

  const vector = await getVectorEmbedding(query);

  const response = await index.query({
    vector,
    topK: 1,
    includeMetadata: true,
  });

  return response.matches[0].id;
};

export const deleteEmbedding = async (id: string) => {
  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_KEY ?? "",
    environment: process.env.PINECONE_ENVIRONMENT ?? "",
  });

  await pinecone.index(process.env.PINECONE_DOCUMENT_INDEX ?? "").deleteOne(id);
};
