import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  enableMultiTabIndexedDbPersistence,
  getFirestore
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Enable offline persistence for cross-device sync resilience.
enableMultiTabIndexedDbPersistence(db).catch((error) => {
  // Ignore known unsupported/lock cases; app still falls back to localStorage cache.
  const code = error && typeof error.code === "string" ? error.code : "";
  if (code !== "failed-precondition" && code !== "unimplemented") {
    console.warn("Firestore offline persistence unavailable:", error);
  }
});

let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(app);
} catch (error) {
  analyticsInstance = null;
}

export const analytics = analyticsInstance;
