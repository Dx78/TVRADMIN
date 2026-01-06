
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAh48U2RVIW7uQE-9Vxswvse--ckpTU6cg",
  authDomain: "system-check-88b3c.firebaseapp.com",
  projectId: "system-check-88b3c",
  storageBucket: "system-check-88b3c.firebasestorage.app",
  messagingSenderId: "576257930680",
  appId: "1:576257930680:web:98ce1b362559e96fd60b4d",
  measurementId: "G-LE09CT67XX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db, analytics };
