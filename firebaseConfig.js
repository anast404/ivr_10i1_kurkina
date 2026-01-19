// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
apiKey: "AIzaSyCD6uZwxCAHUQobBxGHghFYBRTBhk1WRqA",
  authDomain: "happyhome-a40f6.firebaseapp.com",
  projectId: "happyhome-a40f6",
  storageBucket: "happyhome-a40f6.firebasestorage.app",
  messagingSenderId: "586681241990",
  appId: "1:586681241990:web:8ad7c1aacddde010815c07",
  measurementId: "G-5G4PKG1RK6"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);