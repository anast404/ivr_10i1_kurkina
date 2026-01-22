
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import {
  FirebaseApp,
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCD6uZwxCAHUQobBxGHghFYBRTBhk1WRqA",
  authDomain: "happyhome-a40f6.firebaseapp.com",
  projectId: "happyhome-a40f6",
  storageBucket: "happyhome-a40f6.firebasestorage.app",
  messagingSenderId: "586681241990",
  appId: "1:586681241990:web:8ad7c1aacddde010815c07",
  measurementId: "G-5G4PKG1RK6"
};

let app: FirebaseApp
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
    db = getFirestore(app);
  } catch (error) {
    console.log("Error initializing app: " + error);
  }
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };

