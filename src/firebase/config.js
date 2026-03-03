import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const getFirebaseConfig = () => {
  const env = import.meta.env;

  // Case 1: Standard Individual Variables
  if (env.VITE_FIREBASE_PROJECT_ID && !env.VITE_FIREBASE_API_KEY.startsWith('{')) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: env.VITE_FIREBASE_APP_ID
    };
  }

  // Case 2: User mistakenly pasted JSON as a string into VITE_FIREBASE_API_KEY
  try {
    if (env.VITE_FIREBASE_API_KEY?.startsWith('{')) {
      const parsed = JSON.parse(env.VITE_FIREBASE_API_KEY);
      return {
        apiKey: parsed.VITE_FIREBASE_API_KEY || parsed.apiKey,
        authDomain: parsed.VITE_FIREBASE_AUTH_DOMAIN || parsed.authDomain,
        projectId: parsed.VITE_FIREBASE_PROJECT_ID || parsed.projectId,
        storageBucket: parsed.VITE_FIREBASE_STORAGE_BUCKET || parsed.storageBucket,
        messagingSenderId: parsed.VITE_FIREBASE_MESSAGING_SENDER_ID || parsed.messagingSenderId,
        appId: parsed.VITE_FIREBASE_APP_ID || parsed.appId
      };
    }
  } catch (e) {
    console.error("Error parsing Firebase JSON Config:", e);
  }

  // Fallback (for local development)
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID
  };
};

const firebaseConfig = getFirebaseConfig();

// Diagnostic warning
if (!firebaseConfig.projectId && import.meta.env.PROD) {
  console.error("CRITICAL: Firebase Project ID is STILL undefined. Please follow the new 'One-Key' guide.");
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);


