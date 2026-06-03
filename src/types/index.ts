export interface Property {
  id: string;
  name: string;
  address: string;
  image_url: string;
  owner_id: string;
  total_rooms: number;
  created_at: any;

}

export interface Room {
  id: string;
  room_no: string;
  capacity: number;
  monthly_rent: number;
  propertyId: string;
}

export interface Resident {
  id: string;
  name: string;
  gender: string;
  email?: string;
  phone: string;
  room_no: string;
  monthly_rent: number;
  start_date: string;
  end_date: string;
  remarks?: string;
  profileImage?: string;
  isOnline?: boolean;
  propertyId: string;
  created_at: any;
  // Legacy fields for backwards compatibility
  studentName?: string;
  emailId?: string;
  mobileNumber?: string;
  roomNumber?: string;
  rentAmount?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: any;
}

export type RootStackParamList = {
  DashboardList: undefined;
  AddProperty: undefined;
  RoomsList: { propertyId: string; name: string };
  RoomDetails: { roomId: string; propertyId: string; name: string };
};

