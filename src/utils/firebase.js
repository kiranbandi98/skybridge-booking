// src/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBolTKv0XetkbqvtlsgaI9ldfzt6ETSRws",
  authDomain: "skybridge-vendor.firebaseapp.com",
  projectId: "skybridge-vendor",
  storageBucket: "skybridge-vendor.firebasestorage.app",
  messagingSenderId: "1020416526526",
  appId: "1:1020416526526:web:0322b9f8ae2840beddb6ef",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function getFCMMessaging() {
  const supported = await isSupported();
  return supported ? getMessaging(app) : null;
}
