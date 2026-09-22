import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let firebaseAdminInitialized = false;

try {
  if (env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseAdminInitialized = true;
    logger.info('✅ Firebase Admin initialized with service account');
  } else {
    // Attempt default initialization if running on GCP or with GOOGLE_APPLICATION_CREDENTIALS
    if (admin.apps.length === 0) {
      admin.initializeApp({
        projectId: env.FIREBASE_PROJECT_ID,
      });
      firebaseAdminInitialized = true;
      logger.info('ℹ️  Firebase Admin initialized with project ID');
    }
  }
} catch (error: any) {
  logger.warn(`⚠️ Firebase Admin initialization deferred: ${error?.message || error}`);
}

export { admin };
export const isFirebaseInitialized = (): boolean => firebaseAdminInitialized;
