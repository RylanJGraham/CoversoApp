
"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This function ensures that we initialize the app only once.
// It's safe to call this multiple times.
function getClientApp(): FirebaseApp {
    if (getApps().length === 0) {
        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
        };
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return app;
}


function getClientAuth(): Auth {
  // Check if auth is already initialized to avoid re-initializing
  if (!auth) {
    auth = getAuth(getClientApp());
  }
  return auth;
}

function getClientFirestore(): Firestore {
  // Check if db is already initialized
  if (!db) {
    db = getFirestore(getClientApp());
  }
  return db;
}


export { getClientApp, getClientAuth, getClientFirestore };
