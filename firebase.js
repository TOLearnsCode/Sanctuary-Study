import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBBGZGc_tXAgLsCagY_M15bWwsTD1MhVBY",
  authDomain: "sanctuary-labs.firebaseapp.com",
  projectId: "sanctuary-labs",
  storageBucket: "sanctuary-labs.firebasestorage.app",
  messagingSenderId: "165686082507",
  appId: "1:165686082507:web:117d93ffde60325c2b544e",
  measurementId: "G-ZJVR2KG2QC"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(app);
} catch (error) {
  analyticsInstance = null;
}

export const analytics = analyticsInstance;
