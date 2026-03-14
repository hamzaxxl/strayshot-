import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAxxfN6tgR83ZTHerngWsztSVRTuwh038c",
  authDomain: "marketplus-e19b5.web.app",
  projectId: "marketplus-e19b5",
  storageBucket: "marketplus-e19b5.firebasestorage.app",
  messagingSenderId: "988361843377",
  appId: "1:988361843377:web:1b319bc460b2815d74b890",
  measurementId: "G-J132KP31JT"
};

const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
