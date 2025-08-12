
"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined' && !getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
}

function getClientApp(): FirebaseApp {
    if (typeof window === 'undefined') {
        // This is a server-side render, return a placeholder or handle appropriately.
        // For now, we will assume this function is only called on the client.
        // A more robust solution might involve a server-side admin SDK if needed.
        throw new Error("Firebase client SDK can't be used on the server.");
    }
    if (!app) {
        app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    }
    return app;
}

function getClientAuth(): Auth {
  if (typeof window === 'undefined') {
      throw new Error("Firebase client Auth can't be used on the server.");
  }
   if (!auth) {
      auth = getAuth(getClientApp());
  }
  return auth;
}

function getClientFirestore(): Firestore {
  if (typeof window === 'undefined') {
      throw new Error("Firebase client Firestore can't be used on the server.");
  }
  if (!db) {
      db = getFirestore(getClientApp());
  }
  return db;
}


export { getClientApp, getClientAuth, getClientFirestore };
