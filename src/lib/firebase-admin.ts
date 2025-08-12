
import * as admin from 'firebase-admin';

// This file is for server-side access to Firebase services.

// Check if the app is already initialized to prevent errors.
if (!admin.apps.length) {
  try {
    // When deploying to Vercel, you need to use environment variables for the credentials.
    // The SDK will automatically pick them up if they are named correctly.
    // Ensure you have FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY
    // set in your Vercel project settings.
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key must be formatted correctly (replace \\n with \n)
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const adminDb = admin.firestore();

export { adminDb };
