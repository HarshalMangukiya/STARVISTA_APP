import {
  collection,
  addDoc,
  getDocs,
  query,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp
} from '@react-native-firebase/firestore';
import { firestore } from '../config/firebase';
import { Resident } from '../types';

export const residentService = {
  // Fetch all residents for a property
  fetchPropertyResidents: async (propertyId: string): Promise<Resident[]> => {
    try {
      const residentsRef = collection(firestore, 'properties', propertyId, 'residents');
      const q = query(residentsRef);
      const querySnapshot = await getDocs(q);

      const residents: Resident[] = [];
      querySnapshot.forEach((docSnapshot: any) => {
        const data = docSnapshot.data();
        if (data) {
          residents.push({
            id: docSnapshot.id,
            studentName: data.studentName || '',
            gender: data.gender || '',
            emailId: data.emailId || '',
            mobileNumber: data.mobileNumber || '',
            roomNumber: data.roomNumber || '',
            rentAmount: data.rentAmount || 0,
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            remarks: data.remarks || '',
            propertyId: propertyId,
            createdAt: data.createdAt,
          });
        }
      });

      // Sort by creation date (newest first)
      return residents.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('Error fetching residents:', error);
      throw error;
    }
  },

  // Fetch resident by ID
  fetchResidentById: async (residentId: string, propertyId: string): Promise<Resident | null> => {
    try {
      const residentRef = doc(firestore, 'properties', propertyId, 'residents', residentId);
      const docSnapshot = await getDoc(residentRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data) {
          return {
            id: docSnapshot.id,
            studentName: data.studentName || '',
            gender: data.gender || '',
            emailId: data.emailId || '',
            mobileNumber: data.mobileNumber || '',
            roomNumber: data.roomNumber || '',
            rentAmount: data.rentAmount || 0,
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            remarks: data.remarks || '',
            propertyId: propertyId,
            createdAt: data.createdAt,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching resident:', error);
      throw error;
    }
  },

  // Add new resident
  addResident: async (propertyId: string, resident: Omit<Resident, 'id' | 'createdAt'> & { propertyId: string }): Promise<Resident> => {
    try {
      const residentsRef = collection(firestore, 'properties', propertyId, 'residents');

      const docRef = await addDoc(residentsRef, {
        studentName: resident.studentName,
        gender: resident.gender,
        emailId: resident.emailId,
        mobileNumber: resident.mobileNumber,
        roomNumber: resident.roomNumber,
        rentAmount: resident.rentAmount,
        startDate: resident.startDate,
        endDate: resident.endDate,
        remarks: resident.remarks || '',
        createdAt: Timestamp.now(),
      });

      const newResident: Resident = {
        ...resident,
        id: docRef.id,
        createdAt: Timestamp.now(),
      };

      return newResident;
    } catch (error) {
      console.error('Error adding resident:', error);
      throw error;
    }
  },

  // Update resident
  updateResident: async (propertyId: string, residentId: string, updates: Partial<Resident>): Promise<Resident | null> => {
    try {
      const residentRef = doc(firestore, 'properties', propertyId, 'residents', residentId);

      const updateData: any = {};

      if (updates.studentName) updateData.studentName = updates.studentName;
      if (updates.gender) updateData.gender = updates.gender;
      if (updates.emailId) updateData.emailId = updates.emailId;
      if (updates.mobileNumber) updateData.mobileNumber = updates.mobileNumber;
      if (updates.roomNumber) updateData.roomNumber = updates.roomNumber;
      if (updates.rentAmount !== undefined) updateData.rentAmount = updates.rentAmount;
      if (updates.startDate) updateData.startDate = updates.startDate;
      if (updates.endDate) updateData.endDate = updates.endDate;
      if (updates.remarks) updateData.remarks = updates.remarks;

      await updateDoc(residentRef, updateData);

      return await residentService.fetchResidentById(residentId, propertyId);
    } catch (error) {
      console.error('Error updating resident:', error);
      throw error;
    }
  },

  // Delete resident
  deleteResident: async (propertyId: string, residentId: string): Promise<boolean> => {
    try {
      const residentRef = doc(firestore, 'properties', propertyId, 'residents', residentId);
      await deleteDoc(residentRef);
      return true;
    } catch (error) {
      console.error('Error deleting resident:', error);
      throw error;
    }
  },

  // Search residents
  searchResidents: async (propertyId: string, searchQuery: string): Promise<Resident[]> => {
    try {
      const residents = await residentService.fetchPropertyResidents(propertyId);
      return residents.filter(r =>
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.mobileNumber.includes(searchQuery) ||
        r.emailId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching residents:', error);
      throw error;
    }
  },

  // Get residents by payment status
  getResidentsByStatus: async (propertyId: string, status: string): Promise<Resident[]> => {
    try {
      const residents = await residentService.fetchPropertyResidents(propertyId);
      // This helper might need update based on new categorization
      return residents; 
    } catch (error) {
      console.error('Error fetching residents by status:', error);
      throw error;
    }
  },
};
