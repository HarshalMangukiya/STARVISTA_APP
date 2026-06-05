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
import { Room, Resident } from '../types';

// Helper to safely convert Firestore Timestamp or Date or string to YYYY-MM-DD string
const toDateString = (val: any): string => {
  if (!val) return '';
  let date: Date;
  if (typeof val.toDate === 'function') {
    date = val.toDate();
  } else if (val instanceof Date) {
    date = val;
  } else {
    date = new Date(val);
  }
  if (isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Helper to convert YYYY-MM-DD string to Timestamp at noon to avoid timezone shift
const toTimestamp = (dateString: string): Timestamp => {
  if (!dateString) return Timestamp.now();
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12, 0, 0);
  return Timestamp.fromDate(date);
};

export const roomService = {
  // Fetch all rooms for a property (without residents)
  fetchRooms: async (propertyId: string): Promise<Room[]> => {
    try {
      const roomsRef = collection(firestore as any, `properties/${propertyId}/rooms`);
      const q = query(roomsRef);
      const querySnapshot = await getDocs(q);

      const roomsList: Room[] = [];
      querySnapshot.forEach((docSnapshot: any) => {
        const data = docSnapshot.data();
        roomsList.push({
          id: docSnapshot.id,
          room_no: data.room_no || '',
          capacity: Number(data.capacity) || 0,
          monthly_rent: Number(data.monthly_rent) || 0,
          propertyId: propertyId,
        });
      });

      return roomsList.sort((a, b) => {
        return a.room_no.localeCompare(b.room_no, undefined, { numeric: true, sensitivity: 'base' });
      });
    } catch (error) {
      console.error('[roomService] Error fetching rooms:', error);
      throw error;
    }
  },

  // Fetch residents for a specific room
  fetchResidentsForRoom: async (propertyId: string, room: Room): Promise<Resident[]> => {
    try {
      const residentsRef = collection(
        firestore as any,
        `properties/${propertyId}/rooms/${room.id}/residents`
      );
      const residentsSnapshot = await getDocs(query(residentsRef));

      const residents: Resident[] = [];
      residentsSnapshot.forEach((resSnapshot: any) => {
        const data = resSnapshot.data();
        const startDateStr = toDateString(data.start_date);
        const endDateStr = toDateString(data.end_date);
        residents.push({
          id: resSnapshot.id,
          name: data.name || '',
          gender: data.gender || '',
          email: data.email || '',
          phone: data.phone || '',
          room_no: room.room_no,
          monthly_rent: room.monthly_rent,
          start_date: startDateStr,
          end_date: endDateStr,
          remarks: data.remarks || '',
          propertyId: propertyId,
          created_at: data.created_at || Timestamp.now(),

          // Compatibility / Legacy fields
          studentName: data.name || '',
          emailId: data.email || '',
          mobileNumber: data.phone || '',
          roomNumber: room.room_no,
          rentAmount: room.monthly_rent,
          startDate: startDateStr,
          endDate: endDateStr,
          createdAt: data.created_at || Timestamp.now(),
        } as Resident);
      });

      return residents.sort((a, b) => {
        const timeA = a.created_at?.toMillis?.() || 0;
        const timeB = b.created_at?.toMillis?.() || 0;
        return timeB - timeA;
      });
    } catch (error) {
      console.error('[roomService] Error fetching residents for room:', error);
      throw error;
    }
  },

  // Fetch all rooms for a property (with residents nested)
  fetchRoomsWithResidents: async (propertyId: string): Promise<(Room & { residents: Resident[] })[]> => {
    try {
      console.log(`[roomService] Fetching rooms for property: ${propertyId}`);
      const roomsRef = collection(firestore as any, `properties/${propertyId}/rooms`);
      const q = query(roomsRef);
      const querySnapshot = await getDocs(q);

      const roomsList: Room[] = [];
      querySnapshot.forEach((docSnapshot: any) => {
        const data = docSnapshot.data();
        roomsList.push({
          id: docSnapshot.id,
          room_no: data.room_no || '',
          capacity: Number(data.capacity) || 0,
          monthly_rent: Number(data.monthly_rent) || 0,
          propertyId: propertyId,
        });
      });

      // Fetch residents for all rooms in parallel
      const roomsWithResidents = await Promise.all(
        roomsList.map(async (room) => {
          const residentsRef = collection(
            firestore as any,
            `properties/${propertyId}/rooms/${room.id}/residents`
          );
          const residentsSnapshot = await getDocs(query(residentsRef));

          const residents: Resident[] = [];
          residentsSnapshot.forEach((resSnapshot: any) => {
            const data = resSnapshot.data();
            const startDateStr = toDateString(data.start_date);
            const endDateStr = toDateString(data.end_date);
            residents.push({
              id: resSnapshot.id,
              name: data.name || '',
              gender: data.gender || '',
              email: data.email || '',
              phone: data.phone || '',
              room_no: room.room_no,
              monthly_rent: room.monthly_rent,
              start_date: startDateStr,
              end_date: endDateStr,
              remarks: data.remarks || '',
              propertyId: propertyId,
              created_at: data.created_at || Timestamp.now(),

              // Compatibility / Legacy fields
              studentName: data.name || '',
              emailId: data.email || '',
              mobileNumber: data.phone || '',
              roomNumber: room.room_no,
              rentAmount: room.monthly_rent,
              startDate: startDateStr,
              endDate: endDateStr,
              createdAt: data.created_at || Timestamp.now(),
            } as Resident);
          });

          return {
            ...room,
            residents: residents.sort((a, b) => {
              const timeA = a.created_at?.toMillis?.() || 0;
              const timeB = b.created_at?.toMillis?.() || 0;
              return timeB - timeA;
            }),
          };
        })
      );

      // Sort rooms by room number numerically or alphabetically
      return roomsWithResidents.sort((a, b) => {
        return a.room_no.localeCompare(b.room_no, undefined, { numeric: true, sensitivity: 'base' });
      });
    } catch (error) {
      console.error('[roomService] Error fetching rooms with residents:', error);
      throw error;
    }
  },

  // Fetch a single room with its residents (optimized for faster updates)
  fetchRoomWithResidents: async (
    propertyId: string,
    roomId: string
  ): Promise<(Room & { residents: Resident[] }) | null> => {
    try {
      console.log(`[roomService] Fetching single room ${roomId} for property: ${propertyId}`);
      const roomRef = doc(firestore as any, `properties/${propertyId}/rooms`, roomId);
      const roomSnapshot = await getDoc(roomRef);

      if (!roomSnapshot.exists()) {
        return null;
      }

      const roomData = roomSnapshot.data();
      const room: Room = {
        id: roomSnapshot.id,
        room_no: roomData.room_no || '',
        capacity: Number(roomData.capacity) || 0,
        monthly_rent: Number(roomData.monthly_rent) || 0,
        propertyId: propertyId,
      };

      // Fetch residents for this specific room
      const residentsRef = collection(
        firestore as any,
        `properties/${propertyId}/rooms/${roomId}/residents`
      );
      const residentsSnapshot = await getDocs(query(residentsRef));

      const residents: Resident[] = [];
      residentsSnapshot.forEach((resSnapshot: any) => {
        const data = resSnapshot.data();
        const startDateStr = toDateString(data.start_date);
        const endDateStr = toDateString(data.end_date);
        residents.push({
          id: resSnapshot.id,
          name: data.name || '',
          gender: data.gender || '',
          email: data.email || '',
          phone: data.phone || '',
          room_no: room.room_no,
          monthly_rent: room.monthly_rent,
          start_date: startDateStr,
          end_date: endDateStr,
          remarks: data.remarks || '',
          propertyId: propertyId,
          created_at: data.created_at || Timestamp.now(),

          // Compatibility / Legacy fields
          studentName: data.name || '',
          emailId: data.email || '',
          mobileNumber: data.phone || '',
          roomNumber: room.room_no,
          rentAmount: room.monthly_rent,
          startDate: startDateStr,
          endDate: endDateStr,
          createdAt: data.created_at || Timestamp.now(),
        } as Resident);
      });

      return {
        ...room,
        residents: residents.sort((a, b) => {
          const timeA = a.created_at?.toMillis?.() || 0;
          const timeB = b.created_at?.toMillis?.() || 0;
          return timeB - timeA;
        }),
      };
    } catch (error) {
      console.error('[roomService] Error fetching single room with residents:', error);
      throw error;
    }
  },

  // Add new room
  addRoom: async (
    propertyId: string,
    roomData: { room_no: string; capacity: number; monthly_rent: number }
  ): Promise<Room> => {
    try {
      console.log(`[roomService] Adding room to property: ${propertyId}`, roomData);
      const roomsRef = collection(firestore as any, `properties/${propertyId}/rooms`);

      const docRef = await addDoc(roomsRef, {
        room_no: roomData.room_no,
        capacity: Number(roomData.capacity),
        monthly_rent: Number(roomData.monthly_rent),
        created_at: Timestamp.now(),
      });

      return {
        id: docRef.id,
        room_no: roomData.room_no,
        capacity: Number(roomData.capacity),
        monthly_rent: Number(roomData.monthly_rent),
        propertyId,
      };
    } catch (error) {
      console.error('[roomService] Error adding room:', error);
      throw error;
    }
  },

  // Update room
  updateRoom: async (
    propertyId: string,
    roomId: string,
    updates: Partial<{ room_no: string; capacity: number; monthly_rent: number }>
  ): Promise<void> => {
    try {
      console.log(`[roomService] Updating room ${roomId} in property ${propertyId}`, updates);
      const roomRef = doc(firestore as any, `properties/${propertyId}/rooms`, roomId);

      const updateData: any = {};
      if (updates.room_no !== undefined) updateData.room_no = updates.room_no;
      if (updates.capacity !== undefined) updateData.capacity = Number(updates.capacity);
      if (updates.monthly_rent !== undefined) updateData.monthly_rent = Number(updates.monthly_rent);

      await updateDoc(roomRef, updateData);
    } catch (error) {
      console.error('[roomService] Error updating room:', error);
      throw error;
    }
  },

  // Delete room
  deleteRoom: async (propertyId: string, roomId: string): Promise<void> => {
    try {
      console.log(`[roomService] Deleting room ${roomId} in property ${propertyId}`);
      const roomRef = doc(firestore as any, `properties/${propertyId}/rooms`, roomId);
      await deleteDoc(roomRef);
    } catch (error) {
      console.error('[roomService] Error deleting room:', error);
      throw error;
    }
  },

  // Add resident to a room
  addResidentToRoom: async (
    propertyId: string,
    roomId: string,
    residentData: {
      name: string;
      gender: string;
      email?: string;
      phone: string;
      start_date: string;
      end_date: string;
      remarks?: string;
    }
  ): Promise<string> => {
    try {
      console.log(`[roomService] Adding resident to room ${roomId}`, residentData);
      const residentsRef = collection(
        firestore as any,
        `properties/${propertyId}/rooms/${roomId}/residents`
      );

      const docRef = await addDoc(residentsRef, {
        name: residentData.name,
        gender: residentData.gender,
        email: residentData.email || '',
        phone: residentData.phone,
        start_date: toTimestamp(residentData.start_date),
        end_date: toTimestamp(residentData.end_date),
        remarks: residentData.remarks || '',
        created_at: Timestamp.now(),
      });

      return docRef.id;
    } catch (error) {
      console.error('[roomService] Error adding resident to room:', error);
      throw error;
    }
  },

  // Update resident in room
  updateResidentInRoom: async (
    propertyId: string,
    roomId: string,
    residentId: string,
    updates: Partial<{
      name: string;
      gender: string;
      email: string;
      phone: string;
      start_date: string;
      end_date: string;
      remarks: string;
    }>
  ): Promise<void> => {
    try {
      console.log(`[roomService] Updating resident ${residentId} in room ${roomId}`, updates);
      const residentRef = doc(
        firestore as any,
        `properties/${propertyId}/rooms/${roomId}/residents`,
        residentId
      );

      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.gender !== undefined) updateData.gender = updates.gender;
      if (updates.email !== undefined) updateData.email = updates.email;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.remarks !== undefined) updateData.remarks = updates.remarks;
      if (updates.start_date !== undefined) updateData.start_date = toTimestamp(updates.start_date);
      if (updates.end_date !== undefined) updateData.end_date = toTimestamp(updates.end_date);

      await updateDoc(residentRef, updateData);
    } catch (error) {
      console.error('[roomService] Error updating resident in room:', error);
      throw error;
    }
  },

  // Delete resident from room
  deleteResidentFromRoom: async (
    propertyId: string,
    roomId: string,
    residentId: string
  ): Promise<void> => {
    try {
      console.log(`[roomService] Deleting resident ${residentId} from room ${roomId}`);
      const residentRef = doc(
        firestore as any,
        `properties/${propertyId}/rooms/${roomId}/residents`,
        residentId
      );
      await deleteDoc(residentRef);
    } catch (error) {
      console.error('[roomService] Error deleting resident from room:', error);
      throw error;
    }
  },
};
