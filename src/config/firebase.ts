import { initializeApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

// Initialize Firebase App
// On Android: Uses google-services.json from android/app/
// On iOS: Uses GoogleService-Info.plist from iOS project
let firebaseApp: any;

try {
  firebaseApp = initializeApp();
  console.log('✓ Firebase initialized successfully');
  
  // Log Firebase configuration for debugging
  if (firebaseApp && firebaseApp.options) {
    console.log('📱 Firebase Project ID:', firebaseApp.options.projectId);
    console.log('🪣 Firebase Storage Bucket:', firebaseApp.options.storageBucket);
  }
} catch (error) {
  console.error('✗ Firebase initialization error:', error);
  // Continue anyway - some platforms might initialize later
}

// Export Firebase services
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

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

export default firebaseApp;

