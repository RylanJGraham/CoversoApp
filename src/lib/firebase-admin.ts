
import * as admin from 'firebase-admin';

// This file is for server-side initialization of the Firebase Admin SDK.

if (!admin.apps.length) {
  try {
    // When running on Vercel or locally with a .env file,
    // we use a single environment variable to hold the entire service account JSON.
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountJson) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please provide your service account credentials.');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    // The private key needs to have its newlines properly escaped.
    const privateKey = serviceAccount.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: privateKey,
      })
    });

    console.log('Firebase Admin SDK initialized successfully.');

  } catch (error: any) {
    console.error('Firebase admin initialization error:', error);
    // Throw a more specific error to make debugging easier.
    throw new Error('Failed to initialize Firebase Admin SDK. Please check your FIREBASE_SERVICE_ACCOUNT environment variable. Original error: ' + error.message);
  }
}

const adminDb = admin.firestore();
export { adminDb };
