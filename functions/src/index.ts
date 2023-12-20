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
import {
  Presentation,
  insertSlides,
  resolveMissingPresentations,
} from "./data";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

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

  const driveApi = google.drive({ version: "v3", auth: token });

  const files = await driveApi.files.list({
    orderBy: "modifiedTime",
    pageSize: 10,
    q: "mimeType='application/vnd.google-apps.presentation'",
  });

  logger.log({ files });

  const slidesApi = google.slides({ version: "v1", auth: token });

  if (!files.data.files) {
    return;
  }

  const missingSlides = await resolveMissingPresentations(
    uid,
    files.data.files?.map(file => file.id?.toString() ?? "")
  );

  const presentations: Presentation[] = [];
  missingSlides.forEach(async presentationId => {
    const newP = await slidesApi.presentations.get({ presentationId });
    presentations.push(newP.data as Presentation);
  });

  await insertSlides(uid, presentations);

  return;
});
