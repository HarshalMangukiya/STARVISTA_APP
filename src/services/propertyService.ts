import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from '@react-native-firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from '@react-native-firebase/storage';
import { auth, firestore, storage } from '../config/firebase';

// Type definition
export interface Property {
  id?: string;
  propertyName: string;
  address: string;
  imageUrls: string[];
  ownerId: string;
  createdAt: any;
}

/**
 * Get user-friendly error message from Firebase errors
 */
const getErrorMessage = (error: any): string => {
  const errorCode = error?.code || error?.message || '';

  if (errorCode.includes('permission-denied') || errorCode.includes('PERMISSION_DENIED')) {
    return 'Permission denied. Please check Firebase Firestore and Storage security rules. Make sure your user can write to these services.';
  }
  if (errorCode.includes('network') || errorCode.includes('NETWORK')) {
    return 'Network error. Please check your internet connection.';
  }
  if (errorCode.includes('not-found') || errorCode.includes('NOT_FOUND')) {
    return 'Firebase resource not found. Please verify your Firebase configuration.';
  }
  if (errorCode.includes('unauthenticated') || errorCode.includes('UNAUTHENTICATED')) {
    return 'You are not authenticated. Please sign in again.';
  }

  return error?.message || 'An error occurred. Please try again.';
};

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (
  imageUri: string,
  imageName: string,
  userId: string
): Promise<string> => {
  try {
    console.log(`📤 Starting image upload: ${imageName}`);

    // Create a blob from the image URI
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log(`📦 Image blob size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);

    // Create storage reference
    const storageRef = ref(storage, `properties/${userId}/${imageName}`);
    console.log(`🔗 Storage reference: properties/${userId}/${imageName}`);

    // Upload image
    console.log('⬆️  Uploading to Firebase Storage...');
    await uploadBytes(storageRef, blob);
    console.log('✓ Upload complete');

    // Get download URL
    console.log('🔗 Getting download URL...');
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✓ Download URL obtained:', downloadURL.substring(0, 50) + '...');

    return downloadURL;
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    throw new Error(`Image upload failed: ${getErrorMessage(error)}`);
  }
};

/**
 * Upload multiple images to Firebase Storage
 */
export const uploadImages = async (
  imageUris: string[],
  userId: string
): Promise<string[]> => {
  try {
    console.log(`📷 Uploading ${imageUris.length} images...`);

    const uploadPromises = imageUris.map((uri, index) => {
      const timestamp = Date.now();
      const imageName = `image_${timestamp}_${index}`;
      return uploadImage(uri, imageName, userId);
    });

    const imageUrls = await Promise.all(uploadPromises);
    console.log(`✓ All ${imageUrls.length} images uploaded successfully`);
    return imageUrls;
  } catch (error: any) {
    console.error('❌ Error uploading images:', error);
    throw error;
  }
};

/**
 * Save property to Firestore
 */
export const saveProperty = async (
  property: Omit<Property, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    console.log(`👤 Current user: ${currentUser.uid}`);
    console.log(`🏠 Saving property: ${property.propertyName}`);

    const propertyData = {
      ...property,
      ownerId: currentUser.uid,
      createdAt: Timestamp.now(),
    };

    console.log('💾 Writing to Firestore...');
    const docRef = await addDoc(collection(firestore, 'properties'), propertyData);
    console.log(`✓ Property saved with ID: ${docRef.id}`);

    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error saving property:', error);
    throw new Error(`Failed to save property: ${getErrorMessage(error)}`);
  }
};

/**
 * Fetch properties for current user
 */
export const fetchUserProperties = async (): Promise<Property[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    console.log(`🔍 Fetching properties for user: ${currentUser.uid}`);

    const q = query(
      collection(firestore, 'properties'),
      where('ownerId', '==', currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    const properties: Property[] = [];

    querySnapshot.forEach((doc) => {
      properties.push({
        id: doc.id,
        ...doc.data(),
      } as Property);
    });

    console.log(`✓ Found ${properties.length} properties`);
    return properties;
  } catch (error: any) {
    console.error('❌ Error fetching properties:', error);
    throw error;
  }
};

/**
 * Fetch all properties (for admin/public view)
 */
export const fetchAllProperties = async (): Promise<Property[]> => {
  try {
    console.log('🔍 Fetching all properties...');

    const querySnapshot = await getDocs(collection(firestore, 'properties'));
    const properties: Property[] = [];

    querySnapshot.forEach((doc) => {
      properties.push({
        id: doc.id,
        ...doc.data(),
      } as Property);
    });

    console.log(`✓ Found ${properties.length} total properties`);
    return properties;
  } catch (error: any) {
    console.error('❌ Error fetching properties:', error);
    throw error;
  }
};

/**
 * Delete image from Firebase Storage
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    console.log('🗑️  Deleting image from storage...');
    // Extract the path from the URL
    // This is a simplified approach - adjust based on your storage structure
    const storageRef = ref(storage, imageUrl);
    console.warn('⚠️  Image deletion requires storing file paths separately');
  } catch (error: any) {
    console.error('❌ Error deleting image:', error);
    throw error;
  }
};

