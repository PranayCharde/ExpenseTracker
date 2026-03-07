import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyCAQLFEdGoJWLPb3wAp96UpWOr79GeCG0Y",
    authDomain: "spendwise-tracker-pranay-13.firebaseapp.com",
    projectId: "spendwise-tracker-pranay-13",
    storageBucket: "spendwise-tracker-pranay-13.firebasestorage.app",
    messagingSenderId: "743686985267",
    appId: "1:743686985267:web:ae77148cb0a353cd0f3546"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
