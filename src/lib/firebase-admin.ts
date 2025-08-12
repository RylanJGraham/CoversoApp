
import * as admin from 'firebase-admin';

// This file is for server-side access to Firebase services.

// Check if the app is already initialized to prevent errors.
if (!admin.apps.length) {
  // `initializeApp` with no parameters will use the service account credentials
  // automatically provided by the Google Cloud environment (like App Hosting).
  admin.initializeApp();
}

const adminDb = admin.firestore();

export { adminDb };
