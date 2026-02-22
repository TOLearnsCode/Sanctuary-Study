import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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
let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  console.warn("[Sanctuary] Firestore persistence unavailable, using default:", e);
  db = getFirestore(app);
}
export { db };
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let analyticsInstance = null;
try {
  analyticsInstance = getAnalytics(app);
} catch (error) {
  analyticsInstance = null;
}

export const analytics = analyticsInstance;
