import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const app = initializeApp({
  apiKey: "AIzaSyActP8g8Ce9L2Lnbvn5gse0zki7hm0u9Zg",
  authDomain: "ferrisnotes.firebaseapp.com",
  projectId: "ferrisnotes",
  storageBucket: "ferrisnotes.appspot.com",
  messagingSenderId: "904136774468",
  appId: "1:904136774468:web:a529c17f77ce22fb2d7d11",
  measurementId: "G-NEX5V6TCHS",
});

const persist = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in, you can use the 'user' object for user information.
    console.log("User is signed in:", user);
  } else {
    // User is signed out.
    console.log("No user is signed in.");
  }
});

const db = getFirestore(app);

export { db, auth };
