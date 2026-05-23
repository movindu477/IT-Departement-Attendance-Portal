// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration load from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app = null;
let auth = null;
let db = null;
let configError = null;

// Basic validation check for configuration presence
const isConfigMissing = 
  !firebaseConfig.apiKey || 
  firebaseConfig.apiKey === "undefined" || 
  !firebaseConfig.projectId || 
  firebaseConfig.projectId === "undefined";

if (isConfigMissing) {
  configError = new Error("Firebase Configuration variables are missing. Please configure your environment variables.");
} else {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    configError = error;
  }
}

export { app, auth, db, configError };
export default app;

