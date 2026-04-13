export interface Property {
  id: string;
  propertyName: string;
  address: string;
  imageUrls: string[];
  ownerId: string;
  createdAt: any;
}

export interface Resident {
  id: string;
  studentName: string;
  gender: string;
  emailId: string;
  mobileNumber: string;
  roomNumber: string;
  roomType: string;
  rentAmount: number;
  startDate: string;
  endDate: string;
  paymentStatus: 'Paid' | 'Upcoming' | 'Pending';
  remarks?: string;
  profileImage?: string;
  isOnline?: boolean;
  propertyId: string;
  createdAt: any;
}

export type RootStackParamList = {
  DashboardList: undefined;
  AddProperty: undefined;
  ResidentsList: { propertyId: string; propertyName: string };
  AddResident: { propertyId: string; isEditing?: boolean; resident?: Resident };
  ResidentDetails: { residentId: string; propertyId: string };
};
