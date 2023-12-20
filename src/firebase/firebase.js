// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAWrseFMOA2WcnLArJjFRu1D4PEyWhYqdk",
  authDomain: "trbl-ntrvw-121823.firebaseapp.com",
  projectId: "trbl-ntrvw-121823",
  storageBucket: "trbl-ntrvw-121823.appspot.com",
  messagingSenderId: "423569014154",
  appId: "1:423569014154:web:7af506134d4c97cc40dc73",
  measurementId: "G-Y45FR25VM2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
if (app.analytics?.isSupported()) {
  const analytics = getAnalytics(app);
}
export const auth = getAuth(app);
export const functions = getFunctions();
export const firestore = getFirestore(app);
export { httpsCallable };
