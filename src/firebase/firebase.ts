// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup, getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// if () {
//   const analytics = getAnalytics(app);
// }
export const auth = getAuth(app);
export const functions = getFunctions(app);
export const firestore = getFirestore(app);
export { httpsCallable };
export { GoogleAuthProvider, signInWithPopup };
