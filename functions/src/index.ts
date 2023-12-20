/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onCall, onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { google } from "googleapis";
import {
  createFbAuthUser,
  createFbToken,
  getAccessToken,
  getFirebaseAuthUser,
  updateTokens,
} from "./auth";
import { firestore } from "./data";
import { Collection } from "./types";
import OpenAI from "openai";

const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.HANDLER,
});

exports.getAuthentication = onCall(() => {
  try {
    const scopes = [
      "profile",
      "email",
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/presentations",
    ];
    const url = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });
    return { url };
  } catch (error: any) {
    console.error(error);
    return { error: error.message };
  }
});

exports.oauthRedirect = onRequest(async (req, res) => {
  try {
    const { code } = req.query;
    if (typeof code !== "string") {
      throw new Error("Invalid code");
    }
    // Get the Google API Token
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.getAccessToken;
    const { id_token } = tokens;
    if (typeof id_token !== "string") {
      throw new Error("Invalid id_token");
    }

    // Get the user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    let firebaseAuthUser = await getFirebaseAuthUser(userInfo.data.email ?? "");

    if (firebaseAuthUser === "auth/user-not-found") {
      firebaseAuthUser = await createFbAuthUser(
        userInfo.data,
        tokens.refresh_token ?? "",
        tokens.access_token ?? ""
      );
    }

    const fbToken = await createFbToken(firebaseAuthUser.uid);
    await updateTokens(
      firebaseAuthUser.uid,
      tokens.refresh_token ?? "",
      tokens.access_token ?? ""
    );

    res.redirect(
      `${process.env.REDIRECT_PAGE}?id_token=${fbToken}` +
        `&access_token=${tokens.access_token}`
    );
  } catch (e: any) {
    console.warn(e);
    res.status(500).send(e.message);
  }
});

exports.getSlides = onCall(async context => {
  const uid = context.auth?.uid;
  if (!uid) {
    return;
  }
  let token = context.data.access_token;
  if (!token) {
    token = await getAccessToken(context.auth?.uid ?? "");
  }
  if (token === null) {
    throw new Error("Invalid token");
  }

  oauth2Client.setCredentials({ access_token: token });

  const driveApi = google.drive({ version: "v3", auth: oauth2Client });

  const files = await driveApi.files.list({
    orderBy: "modifiedTime desc",
    pageSize: 10,
    q: "mimeType='application/vnd.google-apps.presentation'",
  });

  if (files.data.files !== undefined && files.data.files.length === 0) {
    return;
  }

  const slidesApi = google.slides({ version: "v1", auth: oauth2Client });

  files.data.files?.forEach(async file => {
    if (!file.id) {
      logger.log("invalid file", file);
      return;
    }
    const presentation = await slidesApi.presentations.get({
      presentationId: file.id ?? "",
    });
    logger.log({ p: presentation.data.title });

    const notes: string[] = [];

    presentation.data.slides?.forEach((slide, i) => {
      notes.push("Slide: " + (i + 1) + "\n");
      const notesId =
        slide.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId;
      logger.warn("Note id found", notesId);

      if (notesId !== null && notesId !== undefined) {
        notes.push("Notes:");
        const noteP = slide.slideProperties?.notesPage?.pageElements?.find(
          e => e.objectId === notesId
        );

        logger.warn({ name: "note page", noteP });

        const noteContent = noteP?.shape?.text?.textElements
          ?.map(t => t.textRun?.content)
          .join("");

        logger.warn({ name: "note content", noteContent });

        notes.push(noteContent ?? "");
      }

      notes.push("Content:");
      slide.pageElements
        ?.map(e =>
          e.shape?.text?.textElements?.map(t => t.textRun?.content).join("")
        )
        .forEach(e => notes.push(e ?? ""));
    });

    await firestore
      .collection(Collection.Presentations)
      .doc(file.id)
      .set({
        uid,
        title: presentation.data.title,
        notes: notes.join("\n"),
      });
  });

  return;
});

exports.questionDocument = onCall(async context => {
  const { id, question } = context.data;

  const doc = await firestore
    .collection(Collection.Presentations)
    .doc(id)
    .get();

  const prompt = `Given a document, answer a question about the document
    Do not include any other information. Only include the information that is
    in the document in the answer. If there is a question that 
    cannot be answered, please say that there isn't enough information.
    
    Document: ${doc.data()?.notes}
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

  return { answer: response.choices[0].text };
});
