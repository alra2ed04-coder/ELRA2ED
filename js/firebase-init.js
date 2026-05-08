/**
 * Al-Raed SaaS Platform - Firebase Initialization
 * 
 * IMPORTANT: Replace the config below with your actual Firebase project settings.
 * You can find these in the Firebase Console: Project Settings > General > Your apps.
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app-id.firebaseapp.com",
    projectId: "your-app-id",
    storageBucket: "your-app-id.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Services
const auth = firebase.auth();
const db = firebase.firestore();

// Persistence Setting (Keeps user logged in across browser restarts)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

console.log("✅ Firebase Initialized Successfully");

window.firebaseApp = { auth, db };
