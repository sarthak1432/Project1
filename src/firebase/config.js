import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const getFirebaseConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  // Case 2: User mistakenly pasted JSON as a string into VITE_FIREBASE_API_KEY
  if (apiKey && apiKey.startsWith('{')) {
    try {
      const parsed = JSON.parse(apiKey);
      return {
        apiKey: parsed.VITE_FIREBASE_API_KEY || parsed.apiKey,
        authDomain: parsed.VITE_FIREBASE_AUTH_DOMAIN || parsed.authDomain,
        projectId: parsed.VITE_FIREBASE_PROJECT_ID || parsed.projectId,
        storageBucket: parsed.VITE_FIREBASE_STORAGE_BUCKET || parsed.storageBucket,
        messagingSenderId: parsed.VITE_FIREBASE_MESSAGING_SENDER_ID || parsed.messagingSenderId,
        appId: parsed.VITE_FIREBASE_APP_ID || parsed.appId
      };
    } catch (e) {
      console.error("Error parsing Firebase JSON Config:", e);
    }
  }

  // Standard Individual Variables (or fallback if JSON parsing failed or not applicable)
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId
  };
};

const firebaseConfig = getFirebaseConfig();

// ── DIAGNOSTIC LOGGING ───────────────────────────────────────
console.group("🚀 Firebase Initialization Diagnostic");
console.log("Project ID:", firebaseConfig.projectId || "❌ MISSING");
console.log("API Key:", firebaseConfig.apiKey ? "✅ LOADED" : "❌ MISSING");
console.log("Auth Domain:", firebaseConfig.authDomain || "❌ MISSING");

if (!firebaseConfig.projectId) {
  console.error("CRITICAL: Firebase Project ID is UNDEFINED. Check your .env file or Vite environment setup.");
}
console.groupEnd();

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


