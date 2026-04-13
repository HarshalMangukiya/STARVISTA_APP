import { initializeApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

// Initialize Firebase App (credentials are typically configured via GoogleServices.json on Android and GoogleService-Info.plist on iOS)
const firebaseApp = initializeApp();

// Export Firebase services
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

export default firebaseApp;
