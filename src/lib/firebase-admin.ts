
import * as admin from 'firebase-admin';

// This file is for server-side access to Firebase services.

// Check if the app is already initialized to prevent errors.
if (!admin.apps.length) {
    // When deploying to Vercel or running locally, we use environment variables for the credentials.
    // The SDK will automatically pick them up if they are named correctly.
    // For local development, these are loaded from the .env file.
    
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!privateKey) {
        throw new Error('FIREBASE_PRIVATE_KEY is not set in the environment variables.');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key from the .env file is a single line. 
        // We need to re-format it back to a multi-line PEM format.
        privateKey: privateKey.replace(/-----BEGIN PRIVATE KEY-----/g, '-----BEGIN PRIVATE KEY-----\n').replace(/-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----'),
      }),
    });
}

const adminDb = admin.firestore();

export { adminDb };
