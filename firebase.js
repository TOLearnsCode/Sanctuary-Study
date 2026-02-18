import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBGZGc_tXAgLsCagY_M15bWwsTD1MhVBY",
  authDomain: "sanctuary-labs.firebaseapp.com",
  projectId: "sanctuary-labs",
  storageBucket: "sanctuary-labs.firebasestorage.app",
  messagingSenderId: "165686082507",
  appId: "1:165686082507:web:117d93ffde60325c2b544e",
  measurementId: "G-ZJVR2KG2QC"
};

// Keep Firebase app initialization singleton-safe across module reloads/imports.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(app);
} catch (error) {
  analyticsInstance = null;
}

export const analytics = analyticsInstance;
