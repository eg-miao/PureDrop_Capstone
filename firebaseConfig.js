import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyClsR7XWwvYHQtRfFQTiw9Ob41fMD9elbA",
  authDomain: "puredrop-capstone-project.firebaseapp.com",
  projectId: "puredrop-capstone-project",
  storageBucket: "puredrop-capstone-project.firebasestorage.app",
  messagingSenderId: "781886256531",
  appId: "1:781886256531:web:e50ab386d9a4453d95a466",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
})();

export const db = (() => {
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch {
    return getFirestore(app);
  }
})();
