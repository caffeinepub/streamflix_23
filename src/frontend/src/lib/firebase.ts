import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHEfGdF5i-0KifncUCHJrL6GhrMRz6TMg",
  authDomain: "streamflix-87e91.firebaseapp.com",
  projectId: "streamflix-87e91",
  storageBucket: "streamflix-87e91.firebasestorage.app",
  messagingSenderId: "523565947483",
  appId: "1:523565947483:web:357cb949ae37b25ec43d7e",
  measurementId: "G-94Q9T0TF2L",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
