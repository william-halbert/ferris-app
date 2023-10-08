import * as Updates from "expo-updates";

let Config = {
  apiKey: "process.env.EXPO_PUBLIC_FIREBASE_API_KEY",
  authDomain: "process.env.EXPO_PUBLIC_AUTH_DOMAIN",
  projectId: "process.env.EXPO_PUBLIC_PROJECT_ID",
  storageBucket: "process.env.EXPO_PUBLIC_STORAGE_BUCKET",
  messagingSenderId: "process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID",
  appId: "process.env.EXPO_PUBLIC_APP_ID",
  measurementId: "process.env.EXPO_PUBLIC_MEASUREMENT_ID",
};

export default Config;
