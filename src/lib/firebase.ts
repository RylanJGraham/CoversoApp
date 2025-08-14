
"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: "skillsync-30k6c.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// This function ensures that we are only running this on the client
function getClientApp(): FirebaseApp {
    if (typeof window === 'undefined') {
        // This is a server-side render, we can't initialize the client SDK
        // A more robust solution might involve a server-side admin SDK if needed.
        // For now, we will throw an error, but this code path should not be hit
        // if the functions are used correctly in client components.
        throw new Error("Firebase client SDK can't be used on the server.");
    }

    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    return app;
}

function getClientAuth(): Auth {
  // getClientApp will throw if on server, so this is safe.
  if (!auth) {
      auth = getAuth(getClientApp());
  }
  return auth;
}

function getClientFirestore(): Firestore {
  // getClientApp will throw if on server, so this is safe.
  if (!db) {
      db = getFirestore(getClientApp());
  }
  return db;
}

function getClientStorage(): FirebaseStorage {
    if(!storage) {
        storage = getStorage(getClientApp());
    }
    return storage;
}


export { getClientApp, getClientAuth, getClientFirestore, getClientStorage };
