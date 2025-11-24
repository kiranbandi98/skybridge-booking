// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBoIKtvVXetkbqqvtIsgaI9Ldfzt6ETSRws",
  authDomain: "skybridge-vendor.firebaseapp.com",
  projectId: "skybridge-vendor",
  storageBucket: "skybridge-vendor.appspot.com",
  messagingSenderId: "1020416526526",
  appId: "1:1020416526526:web:8322b9f8ae2840beddb6ef",
  measurementId: "G-J7QLL8NG2L"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Firestore DB reference
export const db = getFirestore(app);
