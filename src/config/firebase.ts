import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// In React Native Firebase, the default app is initialized automatically
// if google-services.json (Android) or GoogleService-Info.plist (iOS) are present.

// Export Firebase services directly
const authInstance = auth();
const firestoreInstance = firestore();
const storageInstance = storage();

// Keep naming compatible
export { authInstance as auth, firestoreInstance as firestore, storageInstance as storage };

/**
 * Utility to properly serialize error objects for debugging
 * Error objects have non-enumerable properties, so JSON.stringify produces {}
 */
export const serializeError = (error: any): any => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code: (error as any).code || 'UNKNOWN',
      stack: error.stack?.split('\n').slice(0, 5) || [], // First 5 stack frames
    };
  }
  return error;
};

export default { auth: authInstance, firestore: firestoreInstance, storage: storageInstance };
