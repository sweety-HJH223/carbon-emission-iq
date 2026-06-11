import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDpiJIugdCZrXAzOnAlkwUTaRSz64wiQmo",
  authDomain: "carboniq-29a8f.firebaseapp.com",
  projectId: "carboniq-29a8f",
  storageBucket: "carboniq-29a8f.firebasestorage.app",
  messagingSenderId: "665218744071",
  appId: "1:665218744071:web:37fb5b3c45ac50aa724fa2",
};

// Prevent duplicate app initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;