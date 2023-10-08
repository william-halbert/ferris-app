import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserSessionPersistence,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage"; //
import {
  EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_AUTH_DOMAIN,
  EXPO_PUBLIC_PROJECT_ID,
  EXPO_PUBLIC_STORAGE_BUCKET,
  EXPO_PUBLIC_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_APP_ID,
  EXPO_PUBLIC_MEASUREMENT_ID,
} from "@env";

const app = initializeApp({
  apiKey: EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: EXPO_PUBLIC_PROJECT_ID,
  storageBucket: EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: EXPO_PUBLIC_APP_ID,
  measurementId: EXPO_PUBLIC_MEASUREMENT_ID,
});
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
//const auth = getAuth(app);
export { db, auth, app };

/*
const app = initializeApp({
  apiKey: "AIzaSyAIUYTYz0GN5R8e9OsfWmPY480Dya7uek0",
  authDomain: "audio-to-text-7ecf6.firebaseapp.com",
  projectId: "audio-to-text-7ecf6",
  storageBucket: "audio-to-text-7ecf6.appspot.com",
  messagingSenderId: "535371888435",
  appId: "1:535371888435:web:c84b2c1cadce471a8ef046",
  measurementId: "G-S6C86K9K7Q",
});
*/
