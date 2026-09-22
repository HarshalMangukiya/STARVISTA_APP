# STARVISTA – Existing Features Inventory

This document represents the audited inventory of all features currently implemented in the **STARVISTA – Hostel Management System** codebase. Every detail corresponds strictly to active source code.

---

## 1. Authentication & Session Management

- **Feature Name**: User Authentication & Session Management
- **Screen(s)**:
  - [`LoginScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/AuthScreens/LoginScreen.tsx)
  - [`SignupScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/AuthScreens/SignupScreen.tsx)
  - [`ProfileScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/AuthScreens/ProfileScreen.tsx)
  - [`SplashScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/SplashScreen.tsx)
- **Existing Firebase Collection**: `users` (Document ID = `firebaseUser.uid`)
- **Existing Fields**:
  - `email`: string
  - `role`: string (defaults to `"Verified Property Owner"`)
  - `createdAt`: string (ISO 8601 string)
  - `photoURL`: optional string
- **Read Operations**:
  - `getDoc(doc(firestore, 'users', firebaseUser.uid))` on login to fetch role
  - `auth.onAuthStateChanged(...)` in `AuthContext.tsx`
  - `AsyncStorage.getItem('user')`, `AsyncStorage.getItem('isLoggedIn')` on application bootstrap
- **Write Operations**:
  - `createUserWithEmailAndPassword(auth, email, password)`
  - `setDoc(doc(firestore, 'users', firebaseUser.uid), { email, role: 'Verified Property Owner', createdAt })` on signup
- **Update Operations**:
  - `updateDoc(doc(firestore, 'users', fbUser.uid), updatedData)` in `authService.updateUserProfile`
  - `sendPasswordResetEmail(auth, email)` in `LoginScreen` and `ProfileScreen`
- **Delete Operations**:
  - `firebaseUser.delete()` (only as transactional rollback if Firestore profile creation fails during signup)
  - `authService.logout()` clears local cache from `AsyncStorage` and calls `signOut(auth)`
- **Authentication Requirements**:
  - Unauthenticated for login, signup, forgot password
  - Authenticated for profile view, update profile, and logout
- **User Roles**:
  - `"Verified Property Owner"`
- **Business Rules**:
  - Email is required and validated against regex (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
  - Password must be at least 6 characters
  - Password and confirm password must match on signup
  - User is not automatically logged in upon signup; must log in explicitly
  - Session cached in `AsyncStorage` under keys `user` and `isLoggedIn` for instant app launches
- **Dependencies**:
  - `@react-native-firebase/auth`
  - `@react-native-firebase/firestore`
  - `@react-native-async-storage/async-storage`
- **Related Screens**: `DashboardScreen`, `SplashScreen`

---

## 2. Property Management

- **Feature Name**: Property Management (Hostels / PGs / Apartments)
- **Screen(s)**:
  - [`DashboardScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/DashboardScreen.tsx)
  - [`AddPropertyScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/AddPropertyScreen.tsx)
  - [`EditPropertyScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/EditPropertyScreen.tsx)
- **Existing Firebase Collection**: `properties` (Auto-generated document ID)
- **Existing Fields**:
  - `id`: string
  - `name`: string (e.g., "Star Hostel")
  - `address`: string
  - `image_url`: string (HTTPS URL from Cloudinary, optional)
  - `owner_id`: string (Firebase Auth UID of the owner)
  - `total_rooms`: number (defaults to 0)
  - `created_at`: Firestore `Timestamp`
- **Read Operations**:
  - `fetchUserProperties`: `query(collection(firestore, 'properties'), where('owner_id', '==', currentUser.uid))`
  - `fetchAllProperties`: `collection(firestore, 'properties')`
  - `getProperty`: `doc(firestore, 'properties', propertyId)`
- **Write Operations**:
  - `saveProperty`: `addDoc(collection(firestore, 'properties'), propertyData)`
- **Update Operations**:
  - `updateProperty`: `updateDoc(doc(firestore, 'properties', propertyId), updates)`
- **Delete Operations**:
  - `deleteProperty`: `deleteDoc(doc(firestore, 'properties', propertyId))`
- **Authentication Requirements**: Authenticated user (`auth.currentUser.uid` must exist)
- **User Roles**: `"Verified Property Owner"`
- **Business Rules**:
  - Property name and address are required
  - Image is optional; if picked, uploaded to Cloudinary unsigned preset `STARVISTA`
  - Properties are scoped strictly to the creating user (`owner_id == currentUser.uid`)
  - Card long-press triggers bottom sheet offering "Edit Property" and "Delete Property"
  - Deletion requires modal confirmation
- **Dependencies**:
  - `@react-native-firebase/firestore`
  - `react-native-image-picker`
  - Cloudinary unsigned upload endpoint
- **Related Screens**: `RoomsListScreen`, `DashboardScreen`

---

## 3. Room Management

- **Feature Name**: Room Management
- **Screen(s)**:
  - [`RoomsListScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/RoomsListScreen.tsx)
  - [`RoomDetailsScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/RoomDetailsScreen.tsx)
- **Existing Firebase Collection**: `properties/{propertyId}/rooms` (Subcollection under property)
- **Existing Fields**:
  - `id`: string
  - `room_no`: string (e.g., "101", "A-1")
  - `capacity`: number (bed capacity, positive integer)
  - `monthly_rent`: number (rent per bed/room in INR)
  - `propertyId`: string
  - `created_at`: Firestore `Timestamp`
- **Read Operations**:
  - `fetchRooms`: `collection(firestore, 'properties/${propertyId}/rooms')`
  - `fetchRoomsWithResidents`: fetches rooms and parallelly fetches residents for each room
  - `fetchRoomWithResidents`: fetches single room and nested residents
- **Write Operations**:
  - `addRoom`: `addDoc(collection(firestore, 'properties/${propertyId}/rooms'), roomData)`
- **Update Operations**:
  - `updateRoom`: `updateDoc(doc(firestore, 'properties/${propertyId}/rooms', roomId), updates)`
- **Delete Operations**:
  - `deleteRoom`: `deleteDoc(doc(firestore, 'properties/${propertyId}/rooms', roomId))`
- **Authentication Requirements**: Authenticated user
- **User Roles**: `"Verified Property Owner"`
- **Business Rules**:
  - Room number is required
  - Capacity must be a positive integer (> 0)
  - Monthly rent must be a valid non-negative number (>= 0)
  - Rooms sorted naturally/numerically by `room_no`
  - Room deletion is strictly prevented if any residents are checked-in (`residents.length > 0`)
  - Occupancy badges:
    - Vacant: 0 residents
    - Available: `residents < capacity`
    - Full: `residents == capacity`
    - Overfilled: `residents > capacity`
- **Dependencies**: `@react-native-firebase/firestore`
- **Related Screens**: `RoomsListScreen`, `RoomDetailsScreen`

---

## 4. Resident / Tenant Management

- **Feature Name**: Resident Onboarding, Maintenance & Removal
- **Screen(s)**:
  - [`RoomDetailsScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/RoomDetailsScreen.tsx)
  - [`residentService.ts`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/services/residentService.ts) (legacy collection helper)
- **Existing Firebase Collection**:
  - Active: `properties/{propertyId}/rooms/{roomId}/residents`
  - Legacy alternate: `residents`
- **Existing Fields**:
  - `id`: string
  - `name`: string
  - `gender`: string (`"Male"` | `"Female"` | `"Other"`)
  - `email`: optional string
  - `phone`: string (mobile number)
  - `start_date`: Firestore `Timestamp` / date string (check-in date)
  - `end_date`: Firestore `Timestamp` / date string (check-out / rent expiry date)
  - `remarks`: optional string
  - `created_at`: Firestore `Timestamp`
  - Legacy fields mapped: `studentName`, `emailId`, `mobileNumber`, `roomNumber`, `rentAmount`, `startDate`, `endDate`, `createdAt`
- **Read Operations**:
  - `fetchResidentsForRoom`: `collection(firestore, 'properties/${propertyId}/rooms/${roomId}/residents')`
  - `fetchResidentById`: `doc(firestore, 'residents', residentId)`
  - `searchResidents`: filtered search across residents by name, phone, or email
- **Write Operations**:
  - `addResidentToRoom`: `addDoc(collection(firestore, 'properties/${propertyId}/rooms/${roomId}/residents'), residentData)`
- **Update Operations**:
  - `updateResidentInRoom`: `updateDoc(doc(firestore, 'properties/${propertyId}/rooms/${roomId}/residents', residentId), updates)`
- **Delete Operations**:
  - `deleteResidentFromRoom`: `deleteDoc(doc(firestore, 'properties/${propertyId}/rooms/${roomId}/residents', residentId))`
- **Authentication Requirements**: Authenticated user
- **User Roles**: `"Verified Property Owner"`
- **Business Rules**:
  - Cannot onboard resident if room is full (`residents.length >= room.capacity`)
  - Resident name is required
  - Phone number validated (minimum 8 digits if provided)
  - Start date (check-in) and end date (check-out) are required
  - Quick duration select: 1 Month, 3 Months, 6 Months (automatically computes `end_date` from `start_date`)
  - Optimistic UI updates locally before backend write completes
  - Swipe left on resident card to trigger "Update Payment" modal
- **Dependencies**: `@react-native-firebase/firestore`, `@react-native-community/datetimepicker`
- **Related Screens**: `RoomDetailsScreen`, `RoomsListScreen`

---

## 5. Rent & Payment Tracking Logic

- **Feature Name**: Rent Cycle & Payment Status Tracking
- **Screen(s)**:
  - [`RoomDetailsScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/RoomDetailsScreen.tsx)
  - [`RoomsListScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/RoomsListScreen.tsx)
  - [`residentCategorization.ts`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/utils/residentCategorization.ts)
- **Existing Firebase Collection**: Tracked dynamically using `start_date` and `end_date` on resident records.
- **Existing Fields**: `start_date`, `end_date`, `monthly_rent`
- **Read Operations**: Date difference computed in frontend
- **Write Operations**:
  - Update payment modal writes new `start_date` and `end_date` to the resident document
- **Business Rules**:
  - Dynamic categorization:
    - **Paid**: `end_date` is > 7 days in the future (Green: `#16a34a` / `#4CAF50`)
    - **Upcoming / Due Soon**: `end_date` is within next 7 days (0 to 7 days) (Amber: `#d97706` / `#FF9800`)
    - **Pending / Overdue**: `end_date` has passed (<= 0 days) (Red: `#dc2626` / `#F44336`)
  - Quick select duration renewal: 1 Month, 3 Months, 6 Months, or manual custom date selection
- **Dependencies**: Native JavaScript Date calculations, `residentCategorization.ts`
- **Related Screens**: `RoomDetailsScreen`

---

## 6. Resident Communication Integrations

- **Feature Name**: Direct Call & WhatsApp Rent Reminder
- **Screen(s)**: [`RoomDetailsScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/RoomDetailsScreen.tsx)
- **Existing Operations**:
  - Direct Phone Call: Strips non-digits, opens `tel:${cleanNumber}` via `Linking.openURL`
  - WhatsApp Rent Reminder:
    - Strips non-digits; prepends country code `91` for 10-digit Indian numbers
    - Formats due date in Indian locale (`en-IN`)
    - Generates status-specific message template:
      - **Due Soon**: *"Hello {name}, Your room payment is due soon. Room No: {roomNo}, Due Date: {date}. Please complete your payment on time. Thank you."*
      - **Overdue**: *"Hello {name}, Your room payment is OVERDUE. Room No: {roomNo}, Due Date: {date}. Please make the payment immediately to avoid any inconvenience. Thank you."*
      - **Friendly Reminder**: *"Hello {name}, This is a friendly reminder regarding your room rent payment. Room No: {roomNo}, Next Due Date: {date}. Thank you."*
    - Opens WhatsApp directly via deep link: `https://wa.me/${cleanNumber}?text=${encodedMessage}`
- **Dependencies**: React Native `Linking`
- **Related Screens**: `RoomDetailsScreen`

---

## 7. Help & Support / Creator Info

- **Feature Name**: Help & Support
- **Screen(s)**: [`HelpSupportScreen.tsx`](file:///c:/Users/Harshal/OneDrive/Desktop/STARVISTA_APP/src/screens/HelpSupportScreen.tsx)
- **Existing Fields / Operations**:
  - Displays project development team (Harshal Mangukiya, Piyush Thummar)
  - Deep links to LinkedIn profiles and direct calling numbers
- **Related Screens**: `ProfileScreen`
