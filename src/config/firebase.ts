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
} catch (error) {
  console.error('✗ Firebase initialization error:', error);
  // Continue anyway - some platforms might initialize later
}

// Export Firebase services
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

export default firebaseApp;

