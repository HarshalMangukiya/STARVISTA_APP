import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@react-native-firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from '@react-native-firebase/firestore';
import { auth, firestore } from '../config/firebase';

interface User {
  email: string;
  role: string;
  photoURL?: string;
}

const STORAGE_KEYS = {
  USER: 'user',
  IS_LOGGED_IN: 'isLoggedIn',
};

class AuthService {
  /**
   * Sign up with email and password
   */
  async signup(email: string, password: string): Promise<User> {
    try {
      console.log('[AuthService] ===== SIGNUP CALLED =====');
      
      // Validate inputs
      if (!email || !password) {
        throw new Error('All fields are required');
      }

      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Create user in Firebase Auth
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (authError: any) {
        if (authError?.code === 'auth/email-already-in-use') {
          throw new Error('This email is already registered. Try logging in instead!');
        }
        throw authError; // bubble up other auth errors
      }

      const firebaseUser = userCredential.user;

      try {
        // Store role in Firestore
        const userDocRef = doc(firestore as any, 'users', firebaseUser.uid);
        await setDoc(userDocRef, {
          email,
          role: 'Verified Property Owner',
          createdAt: new Date().toISOString(),
        });
      } catch (firestoreError: any) {
        // Rollback: delete the user from Authentication so they can try again once DB rules are fixed!
        try {
          await firebaseUser.delete();
        } catch (deleteError) {
          console.error('Failed to rollback user:', deleteError);
        }

        if (firestoreError?.code === 'permission-denied' || firestoreError?.message?.includes('permission')) {
          throw new Error('A database error occurred (Permission Denied). Make sure your Firebase Rules are updated!');
        }
        throw firestoreError;
      }

      console.log('[AuthService] User created in Firebase and Firestore');

      const user: User = {
        email,
        role: 'Verified Property Owner',
      };

      console.log('[AuthService] ===== SIGNUP SUCCESSFUL =====');
      return user;
    } catch (error: any) {
      console.error('[AuthService] SIGNUP ERROR:', error?.message || error);
      throw error;
    }
  }

  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<User> {
    if (!email || !password) {
      throw new Error('All fields are required');
    }

    try {
      // Trim and normalize email
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();
      
      console.log('[AuthService] Login attempt for:', trimmedEmail);

      // 1. Authenticate with Firebase Auth
      let userCredential;
      try {
        userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
        console.log('[AuthService] Authentication successful for UID:', userCredential.user.uid);
      } catch (authError: any) {
        console.error('[AuthService] Firebase Auth Error:', {
          code: authError?.code,
          message: authError?.message,
          nativeErrorMessage: authError?.nativeErrorMessage,
        });
        
        // Map Firebase error codes to user-friendly messages
        if (authError?.code === 'auth/user-not-found') {
          throw new Error('No account found with this email address. Please sign up first.');
        } else if (authError?.code === 'auth/wrong-password') {
          throw new Error('Incorrect email or password');
        } else if (authError?.code === 'auth/invalid-credential' || authError?.code === 'auth/invalid-email') {
          throw new Error('Incorrect email or password');
        } else if (authError?.code === 'auth/user-disabled') {
          throw new Error('This account has been disabled. Please contact support.');
        } else if (authError?.message?.includes('too-many-requests')) {
          throw new Error('Too many login attempts. Please try again later.');
        }
        
        throw authError;
      }

      const firebaseUser = userCredential.user;

      // 2. Fetch the user's document from Firestore
      let userDoc;
      try {
        const userDocRef = doc(firestore as any, 'users', firebaseUser.uid);
        userDoc = await getDoc(userDocRef);
        console.log('[AuthService] Firestore user doc exists:', userDoc.exists());
      } catch (firestoreError: any) {
        console.warn('[AuthService] Firestore read error:', {
          code: firestoreError?.code,
          message: firestoreError?.message,
        });
        
        // Allow login even if Firestore read fails, but notify
        if (firestoreError?.code === 'permission-denied') {
          console.warn('[AuthService] Permission denied reading user doc. Check Firestore rules.');
          // Continue anyway - user is authenticated
        }
      }
      
      if (!userDoc?.exists()) {
        // This shouldn't normally happen unless DB is out of sync
        // Try to create the user doc
        console.warn('[AuthService] User doc missing, attempting to create...');
        try {
          const userDocRef = doc(firestore as any, 'users', firebaseUser.uid);
          await setDoc(userDocRef, {
            email: trimmedEmail,
            role: 'Verified Property Owner',
            createdAt: new Date().toISOString(),
          });
          console.log('[AuthService] User doc created successfully');
        } catch (createError: any) {
          console.error('[AuthService] Failed to create user doc:', createError?.message);
          // Don't fail login if we can't create the doc
          // The user is still authenticated
        }
      }

      const userData = userDoc?.data();

      const user: User = {
        email: firebaseUser.email || trimmedEmail,
        role: userData?.role || 'Verified Property Owner',
      };

      // 3. Keep backward compatibility with AsyncStorage for fast boots
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        await AsyncStorage.setItem(STORAGE_KEYS.IS_LOGGED_IN, 'true');
        console.log('[AuthService] User data saved to AsyncStorage');
      } catch (storageError) {
        console.warn('[AuthService] Failed to save to AsyncStorage:', storageError);
        // Don't fail login if AsyncStorage fails
      }

      console.log('[AuthService] ===== LOGIN SUCCESSFUL =====');
      return user;
    } catch (error: any) {
      console.error('[AuthService] LOGIN ERROR:', {
        message: error?.message,
        code: error?.code,
      });
      throw error;
    }
  }

  /**
   * Get current logged-in user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userStr) {
        return JSON.parse(userStr);
      }
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      const isLoggedIn = await AsyncStorage.getItem(STORAGE_KEYS.IS_LOGGED_IN);
      return isLoggedIn === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // 1. Sign out of Firebase
      await signOut(auth);
      
      // 2. Clear async storage
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.IS_LOGGED_IN);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(email: string, updatedData: Partial<User>): Promise<User> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    const updatedUser: User = { ...currentUser, ...updatedData };
    
    // Also update Firestore if needed
    const fbUser = auth.currentUser;
    if (fbUser) {
      const userDocRef = doc(firestore as any, 'users', fbUser.uid);
      await updateDoc(userDocRef, updatedData);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    return updatedUser;
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export default new AuthService();
