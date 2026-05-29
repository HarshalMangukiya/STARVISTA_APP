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
      const residentsRef = collection(firestore as any, 'residents');
      const q = query(residentsRef);
      const querySnapshot = await getDocs(q);

      const residents: Resident[] = [];
      querySnapshot.forEach((docSnapshot: any) => {
        const data = docSnapshot.data();
        if (data) {
          residents.push({
            id: docSnapshot.id,
            name: data.name || data.studentName || '',
            gender: data.gender || '',
            email: data.email || data.emailId || '',
            phone: data.phone || data.mobileNumber || '',
            room_no: data.room_no || data.roomNumber || '',
            monthly_rent: data.monthly_rent || data.rentAmount || 0,
            start_date: data.start_date || data.startDate || '',
            end_date: data.end_date || data.endDate || '',
            remarks: data.remarks || '',
            propertyId: data.propertyId || propertyId,
            created_at: data.created_at || data.createdAt,
            // Legacy fields
            studentName: data.name || data.studentName,
            emailId: data.email || data.emailId,
            mobileNumber: data.phone || data.mobileNumber,
            roomNumber: data.room_no || data.roomNumber,
            rentAmount: data.monthly_rent || data.rentAmount,
            startDate: data.start_date || data.startDate,
            endDate: data.end_date || data.endDate,
            createdAt: data.created_at || data.createdAt,
          } as Resident);
        }
      });

      // Sort by creation date (newest first)
      return residents.sort((a, b) => {
        const timeA = a.created_at?.toMillis?.() || 0;
        const timeB = b.created_at?.toMillis?.() || 0;
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
      const residentRef = doc(firestore as any, 'residents', residentId);
      const docSnapshot = await getDoc(residentRef);

      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data) {
          return {
            id: docSnapshot.id,
            name: data.name || data.studentName || '',
            gender: data.gender || '',
            email: data.email || data.emailId || '',
            phone: data.phone || data.mobileNumber || '',
            room_no: data.room_no || data.roomNumber || '',
            monthly_rent: data.monthly_rent || data.rentAmount || 0,
            start_date: data.start_date || data.startDate || '',
            end_date: data.end_date || data.endDate || '',
            remarks: data.remarks || '',
            propertyId: propertyId,
            created_at: data.created_at || data.createdAt,
            // Legacy fields
            studentName: data.name || data.studentName,
            emailId: data.email || data.emailId,
            mobileNumber: data.phone || data.mobileNumber,
            roomNumber: data.room_no || data.roomNumber,
            rentAmount: data.monthly_rent || data.rentAmount,
            startDate: data.start_date || data.startDate,
            endDate: data.end_date || data.endDate,
            createdAt: data.created_at || data.createdAt,
          } as Resident;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching resident:', error);
      throw error;
    }
  },

  // Add new resident
  addResident: async (propertyId: string, resident: Omit<Resident, 'id' | 'created_at'> & { propertyId: string }): Promise<Resident> => {
    try {
      const residentsRef = collection(firestore as any, 'residents');

      // Map legacy field names to new field names
      const residentData = {
        name: resident.name || resident.studentName,
        gender: resident.gender,
        email: resident.email || resident.emailId,
        phone: resident.phone || resident.mobileNumber,
        room_no: resident.room_no || resident.roomNumber,
        monthly_rent: resident.monthly_rent || resident.rentAmount,
        start_date: resident.start_date || resident.startDate,
        end_date: resident.end_date || resident.endDate,
        remarks: resident.remarks || '',
        propertyId: propertyId,
        created_at: Timestamp.now(),
      };

      const docRef = await addDoc(residentsRef, residentData);

      const newResident: Resident = {
        ...resident,
        id: docRef.id,
        created_at: Timestamp.now(),
      } as Resident;

      return newResident;
    } catch (error) {
      console.error('Error adding resident:', error);
      throw error;
    }
  },

  // Update resident
  updateResident: async (propertyId: string, residentId: string, updates: Partial<Resident>): Promise<Resident | null> => {
    try {
      const residentRef = doc(firestore as any, 'residents', residentId);

      const updateData: any = {};

      if (updates.name || updates.studentName) updateData.name = updates.name || updates.studentName;
      if (updates.gender) updateData.gender = updates.gender;
      if (updates.email || updates.emailId) updateData.email = updates.email || updates.emailId;
      if (updates.phone || updates.mobileNumber) updateData.phone = updates.phone || updates.mobileNumber;
      if (updates.room_no || updates.roomNumber) updateData.room_no = updates.room_no || updates.roomNumber;
      if (updates.monthly_rent !== undefined || updates.rentAmount !== undefined) updateData.monthly_rent = updates.monthly_rent ?? updates.rentAmount;
      if (updates.start_date || updates.startDate) updateData.start_date = updates.start_date || updates.startDate;
      if (updates.end_date || updates.endDate) updateData.end_date = updates.end_date || updates.endDate;
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
      const residentRef = doc(firestore as any, 'residents', residentId);
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
        (r.name || r.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.phone || r.mobileNumber || '').includes(searchQuery) ||
        (r.email || r.emailId || '').toLowerCase().includes(searchQuery.toLowerCase())
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
