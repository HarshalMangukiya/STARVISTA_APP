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
 * Upload image to Firebase Storage
 */
export const uploadImage = async (
  imageUri: string,
  imageName: string,
  userId: string
): Promise<string> => {
  try {
    // Create a blob from the image URI
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create storage reference
    const storageRef = ref(storage, `properties/${userId}/${imageName}`);

    // Upload image
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
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
    const uploadPromises = imageUris.map((uri, index) => {
      const timestamp = Date.now();
      const imageName = `image_${timestamp}_${index}`;
      return uploadImage(uri, imageName, userId);
    });

    const imageUrls = await Promise.all(uploadPromises);
    return imageUrls;
  } catch (error) {
    console.error('Error uploading images:', error);
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
      throw new Error('User not authenticated');
    }

    const propertyData = {
      ...property,
      ownerId: currentUser.uid,
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(firestore, 'properties'), propertyData);
    return docRef.id;
  } catch (error) {
    console.error('Error saving property:', error);
    throw error;
  }
};

/**
 * Fetch properties for current user
 */
export const fetchUserProperties = async (): Promise<Property[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

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

    return properties;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

/**
 * Fetch all properties (for admin/public view)
 */
export const fetchAllProperties = async (): Promise<Property[]> => {
  try {
    const querySnapshot = await getDocs(collection(firestore, 'properties'));
    const properties: Property[] = [];

    querySnapshot.forEach((doc) => {
      properties.push({
        id: doc.id,
        ...doc.data(),
      } as Property);
    });

    return properties;
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
};

/**
 * Delete image from Firebase Storage
 */
export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    // This is a simplified approach - adjust based on your storage structure
    const storageRef = ref(storage, imageUrl);
    // Note: Firebase SDK doesn't have a direct deleteByUrl method
    // You would need to store the path separately or parse the URL
    console.warn('Image deletion requires storing file paths separately');
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
