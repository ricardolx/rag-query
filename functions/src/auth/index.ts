import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { Collection } from "../types";
import { initializeApp } from "firebase-admin/app";

initializeApp();

export const firestore = getFirestore();
export const auth = getAuth();

export const getFirebaseAuthUser = async (email: string) => {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error: any) {
    console.error(error.message);
    return error.code;
  }
};

export const getUserRecord = async (uid: string) => {
  try {
    const userRecord = await firestore
      .collection(Collection.Users)
      .doc(uid)
      .get();
    return userRecord;
  } catch (error: any) {
    console.error(error.message);
    return null;
  }
};

export const createFbAuthUser = async (
  userInfo: any,
  refreshToken: string,
  accessToken: string
) => {
  try {
    const userRecord = await auth.createUser({
      email: userInfo.email,
      displayName: userInfo.name,
      emailVerified: true,
      providerToLink: {
        providerId: "google.com",
      },
    });

    await firestore
      .collection(Collection.Users)
      .doc(userRecord.uid)
      .set({
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        refresh_token: refreshToken,
        access_token: accessToken,
        token_expiration: Date.now() + 3600 * 1000,
      });
    return userRecord;
  } catch (error: any) {
    console.error(error.message);
    return null;
  }
};

export const updateTokens = async (
  userId: string,
  refreshToken: string,
  accessToken: string,
  updateRefresh = true
) => {
  try {
    const userRef = firestore.collection(Collection.Users).doc(userId);
    const user = await userRef.get();
    if (!user.exists) {
      await userRef.set({
        refresh_token: refreshToken,
        access_token: accessToken,
        token_expiration: Date.now() + 3600 * 1000,
      });
    } else {
      if (updateRefresh) {
        await userRef.update({
          refresh_token: refreshToken,
          access_token: accessToken,
          token_expiration: Date.now() + 3600 * 1000,
        });
      } else {
        await userRef.update({
          access_token: accessToken,
          token_expiration: Date.now() + 3600 * 1000,
        });
      }
    }
    console.log("Successfully updated tokens for user ", userId);
  } catch (error: any) {
    console.error(`Error updating tokens for user ${userId}: ${error.message}`);
  }
};

export const createFbToken = async (userId: string) => {
  try {
    console.log("Creating custom token for user ", userId);
    const customToken = await auth.createCustomToken(userId);
    console.log("Successfully created custom token for user ", userId);
    return customToken;
  } catch (error: any) {
    console.error(`Error creating custom token for user ${userId}: ${error}`);
    console.error(error.message);
    return null;
  }
};

export const getAccessToken = async (userId: string) => {
  try {
    const userRef = firestore.collection(Collection.Users).doc(userId);
    const user = await userRef.get();
    return user.data()?.access_token;
  } catch (error: any) {
    console.error(error.message);
    return null;
  }
};

export const refreshAccessToken = async (userId: string, client: any) => {
  try {
    const userRef = firestore.collection(Collection.Users).doc(userId);
    const user = await userRef.get();
    const token = user.data()?.refresh_token;

    client.setCredentials({ refresh_token: token });
    await client.refreshAccessToken();
  } catch (error: any) {
    console.log(error.message);
  }
};
