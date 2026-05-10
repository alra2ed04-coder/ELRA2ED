/**
 * Al-Raed SaaS Platform - Firebase Initialization
 * 
 * IMPORTANT: Replace the config below with your actual Firebase project settings.
 * You can find these in the Firebase Console: Project Settings > General > Your apps.
 */

const firebaseConfig = {
    apiKey: "AIzaSyAOtDkZA0gC0Ct7AaAoZIS-volT9XKnnrc",
    authDomain: "alraed-e4d2f.firebaseapp.com",
    projectId: "alraed-e4d2f",
    storageBucket: "alraed-e4d2f.firebasestorage.app",
    messagingSenderId: "1020246695771",
    appId: "1:1020246695771:web:ad4e35b67130ded1ba047e",
    measurementId: "G-L6QZKV6M0E"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();

// Persistence Setting (Keeps user logged in across browser restarts)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

console.log("✅ Firebase Initialized Successfully");

// NOTE: Store.connectSync() is called from app.js after all modules are loaded.

window.firebaseApp = { auth, db };
