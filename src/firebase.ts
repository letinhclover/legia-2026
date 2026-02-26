import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCppn-nRQNDthcGiCY_l5Y4AnA6tdIDTMM",
  authDomain: "legia-2026.firebaseapp.com",
  projectId: "legia-2026",
  storageBucket: "legia-2026.firebasestorage.app",
  messagingSenderId: "825387632814",
  appId: "1:825387632814:web:f1a36148fd0e9359df053f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
