import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ⚠️ GANTI DENGAN CONFIG DARI FIREBASE CONSOLE KAMU
const firebaseConfig = {
    apiKey: "AIzaSyCkZd7mkg6T6j1iCg15gsc02-EF97gajXE",
    authDomain: "home-service-bengkalis.firebaseapp.com",
    projectId: "home-service-bengkalis",
    storageBucket: "home-service-bengkalis.firebasestorage.app",
    messagingSenderId: "901348636964",
    appId: "1:901348636964:web:d5a8f40e6d48d17f1d5bb1",
    measurementId: "G-NDVV5J1SGY"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);