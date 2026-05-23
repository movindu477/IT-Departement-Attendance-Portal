// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSXlF2drOKAd3hPl5hipeI0UsgJVTzYBc",
  authDomain: "attendance-portal-it.firebaseapp.com",
  projectId: "attendance-portal-it",
  storageBucket: "attendance-portal-it.firebasestorage.app",
  messagingSenderId: "1002132763732",
  appId: "1:1002132763732:web:ea668f7a8f659768ee69c1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Expose Auth module
export const auth = getAuth(app);

export default app;
