import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { auth, firestore, serializeError } from '../config/firebase';
import { uploadImageToCloudinary, uploadMultipleImages as uploadMultipleCloudinary } from './cloudinaryService';
import { Property } from '../types';

/**
 * Get user-friendly error message from Firestore errors
 */
const getErrorMessage = (error: any): string => {
  const errorCode = error?.code || error?.message || '';
  const errorMessage = error?.message || '';

  console.error('❌ Firestore Error Details:', {
    code: error?.code,
    message: errorMessage,
    fullError: serializeError(error),
  });

  if (errorCode.includes('permission-denied') || errorCode.includes('PERMISSION_DENIED')) {
    return 'Permission denied. Please check Firestore security rules.';
  }
  if (errorCode.includes('network') || errorCode.includes('NETWORK') || errorCode.includes('failed')) {
    return 'Network error. Please check your internet connection.';
  }
  if (errorCode.includes('not-found') || errorCode.includes('NOT_FOUND')) {
    return 'Resource not found. Please verify your Firestore configuration.';
  }
  if (errorCode.includes('unauthenticated') || errorCode.includes('UNAUTHENTICATED')) {
    return 'You are not authenticated. Please sign in again.';
  }

  return errorMessage || 'An error occurred. Please try again.';
};

/**
 * Upload single property image to Cloudinary
 * Returns the secure_url for storage in Firestore
 */
export const uploadPropertyImage = async (
  propertyId: string,
  imageUri: string
): Promise<string> => {
  try {
    console.log(`🚀 Uploading property image for propertyId: ${propertyId}`);

    // Upload to Cloudinary (returns { url, public_id, secure_url })
    const result = await uploadImageToCloudinary(imageUri, `property-${propertyId}`);

    console.log(`✅ Image uploaded successfully`);
    console.log(`   Public ID: ${result.public_id}`);
    console.log(`   Secure URL: ${result.secure_url.substring(0, 80)}...`);

    return result.secure_url; // Return the HTTPS URL for storage in Firestore
  } catch (error: any) {
    console.error('❌ Error uploading property image:', error);
    throw error; // Re-throw with Cloudinary's error message
  }
};

/**
 * Upload image to Cloudinary with custom filename
 */
export const uploadImage = async (
  imageUri: string,
  imageName: string,
  userId: string
): Promise<string> => {
  try {
    console.log(`📤 Uploading image: ${imageName} for user: ${userId}`);

    const filename = `${userId}-${imageName}`;
    const result = await uploadImageToCloudinary(imageUri, filename);

    console.log(`✅ Image uploaded: ${result.public_id}`);
    return result.secure_url;
  } catch (error: any) {
    console.error('❌ Error uploading image:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary in parallel
 */
export const uploadImages = async (
  imageUris: string[],
  userId: string
): Promise<string[]> => {
  try {
    console.log(`📷 Uploading ${imageUris.length} images for user: ${userId}...`);

    const results = await uploadMultipleCloudinary(imageUris);
    const secureUrls = results.map((result) => result.secure_url);

    console.log(`✅ Uploaded ${secureUrls.length} images successfully`);
    return secureUrls;
  } catch (error: any) {
    console.error('❌ Error uploading images:', error);
    throw error;
  }
};

/**
 * Save property to Firestore
 */
export const saveProperty = async (
  property: Omit<Property, 'id' | 'createdAt' | 'ownerId'>
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
    console.log(`✅ Property saved with ID: ${docRef.id}`);

    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error saving property:', error);
    const userMessage = getErrorMessage(error);
    throw new Error(`Failed to save property: ${userMessage}`);
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

    querySnapshot.forEach((docSnapshot: any) => {
      properties.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as Property);
    });

    console.log(`✅ Found ${properties.length} properties`);
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

    querySnapshot.forEach((docSnapshot: any) => {
      properties.push({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      } as Property);
    });

    console.log(`✅ Found ${properties.length} total properties`);
    return properties;
  } catch (error: any) {
    console.error('❌ Error fetching properties:', error);
    throw error;
  }
};

/**
 * Delete property and image reference
 * Note: Actual Cloudinary deletion handled separately via backend
 */
export const deleteProperty = async (propertyId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    console.log(`🗑️  Starting property deletion: ${propertyId}`);

    // Fetch the property to get image URL
    const propertyRef = doc(firestore, 'properties', propertyId);
    const propertySnap = await getDoc(propertyRef) as FirebaseFirestoreTypes.DocumentSnapshot<Property>;
    
    const propertyData: Property | undefined = propertySnap.data();

    // Log image info for reference (actual deletion via Cloudinary dashboard)
    if (propertyData?.imageUrls && propertyData.imageUrls.length > 0) {
      console.log('📷 Image reference: ' + propertyData.imageUrls[0].substring(0, 60) + '...');
      console.log('    Note: To delete from Cloudinary, use dashboard');
    }

    // Delete property from Firestore
    console.log('💾 Deleting property from Firestore...');
    await deleteDoc(doc(firestore, 'properties', propertyId));
    console.log(`✅ Property deleted successfully: ${propertyId}`);
  } catch (error: any) {
    console.error('❌ Error deleting property:', error);
    throw new Error(`Failed to delete property: ${getErrorMessage(error)}`);
  }
};

/**
 * Update existing property in Firestore
 */
export const updateProperty = async (
  propertyId: string,
  updates: Partial<Omit<Property, 'id' | 'createdAt' | 'ownerId'>>
): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    console.log(`🏠 Updating property ID: ${propertyId}`);
    
    const docRef = doc(firestore, 'properties', propertyId);
    console.log('💾 Writing updates to Firestore...');
    await updateDoc(docRef, updates);
    console.log(`✅ Property updated successfully: ${propertyId}`);
  } catch (error: any) {
    console.error('❌ Error updating property:', error);
    throw new Error(`Failed to update property: ${getErrorMessage(error)}`);
  }
};

/**
 * Get single property by ID
 */
export const getProperty = async (propertyId: string): Promise<Property | null> => {
  try {
    console.log(`🔍 Fetching property: ${propertyId}`);

    const propertyRef = doc(firestore, 'properties', propertyId);
    const propertySnap = await getDoc(propertyRef) as FirebaseFirestoreTypes.DocumentSnapshot<Property>;

    if (!propertySnap.exists) {
      console.log('⚠️  Property not found');
      return null;
    }

    const property: Property = {
      id: propertySnap.id,
      ...propertySnap.data(),
    } as Property;

    console.log(`✅ Property fetched: ${property.propertyName}`);
    return property;
  } catch (error: any) {
    console.error('❌ Error fetching property:', error);
    throw error;
  }
};

/**
 * Delete image from storage placeholder
 * Note: Cloudinary deletion is handled via backend for security.
 * This function handles the reference cleanup intent and prevents app crashes.
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    console.log('🗑️ Image deletion requested for URL:', imageUrl);
    // In a full implementation, you would extract the public_id from the URL
    // and call a backend endpoint to delete it from Cloudinary.
  } catch (error) {
    console.warn('⚠️ Error in deleteImageFromStorage:', error);
  }
};