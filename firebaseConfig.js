
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
apiKey: "AIzaSyCD6uZwxCAHUQobBxGHghFYBRTBhk1WRqA",
  authDomain: "happyhome-a40f6.firebaseapp.com",
  projectId: "happyhome-a40f6",
  storageBucket: "happyhome-a40f6.firebasestorage.app",
  messagingSenderId: "586681241990",
  appId: "1:586681241990:web:8ad7c1aacddde010815c07",
  measurementId: "G-5G4PKG1RK6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
