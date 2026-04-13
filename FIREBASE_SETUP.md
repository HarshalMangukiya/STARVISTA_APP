# STARVISTA Property Management App - Setup Guide

## Project Structure

```
STARVISTA/
├── src/
│   ├── config/
│   │   └── firebase.ts              # Firebase initialization
│   ├── screens/
│   │   ├── LoginScreen.tsx          # Authentication screen
│   │   ├── DashboardScreen.tsx      # Properties list
│   │   └── AddPropertyScreen.tsx    # Add/edit property
│   ├── services/
│   │   └── propertyService.ts       # Firebase operations
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # Main navigation
│   │   └── AuthNavigator.tsx        # Auth navigation
│   └── styles/
│       └── styles.ts                # Shared styles
├── App.tsx                          # Main app component
├── package.json                     # Dependencies
└── README.md

```

## Prerequisites

- Node.js >= 22.11.0
- React Native CLI v20.1.3+
- Firebase project created (Google Cloud Console)
- Android Studio (for Android development)
- Xcode (for iOS development)

## Firebase Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project"
3. Enter project name (e.g., "STARVISTA")
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Add Firebase Apps

#### For Android:

1. In Firebase Console, go to Project Settings
2. Click "Add app" and select Android
3. Enter package name: **com.starvista**
4. Click "Register app"
5. Download `google-services.json`
6. Move it to: `STARVISTA/android/app/`
7. Add these lines to `STARVISTA/android/build.gradle`:

```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.3.14'
  }
}
```

8. Add to `STARVISTA/android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'
```

#### For iOS:

1. In Firebase Console, go to Project Settings
2. Click "Add app" and select iOS
3. Enter bundle ID: **com.starvista**
4. Click "Register app"
5. Download `GoogleService-Info.plist`
6. Open `STARVISTA/ios/STARVISTA.xcworkspace`
7. Drag `GoogleService-Info.plist` into Xcode (select "Copy items if needed")

### 3. Enable Firebase Services

#### Authentication:

1. Firebase Console → Authentication
2. Sign-in method → Email/Password
3. Enable "Email/Password" toggle
4. Click "Save"

#### Firestore Database:

1. Firebase Console → Firestore Database
2. Click "Create database"
3. Select "Start in test mode" (for development)
4. Choose a region close to you
5. Click "Create"

#### Cloud Storage:

1. Firebase Console → Storage
2. Click "Create bucket"
3. Select region and click "Create"

### 4. Firebase Security Rules

#### For Development (Test Mode):

Firestore Rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Test mode: allow all reads/writes for authenticated users
    match /properties/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Storage Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload to their folder
    match /properties/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

**⚠️ WARNING**: These are test rules. FOR PRODUCTION, use stricter rules!

## Installation

### 1. Install Dependencies

```bash
cd STARVISTA
npm install
```

### 2. Link Firebase (if not auto-linked)

```bash
npx react-native-firebase-cli setup
```

## Running the App

### Android:

```bash
npm run android
```

Or:

```bash
npx react-native run-android
```

### iOS:

```bash
cd ios
pod install
cd ..
npm run ios
```

Or:

```bash
npx react-native run-ios
```

### Start Metro Bundler:

```bash
npm start
```

## Features

### 1. Authentication
- Email/Password Sign Up
- Email/Password Sign In
- Automatic session persistence
- Demo account: demo@test.com / demo123

### 2. Dashboard
- List all properties of the logged-in user
- Display property image, name, and address
- Floating action button to add new property
- Pull to refresh (via useFocusEffect)
- Error handling with retry

### 3. Add Property
- Enter property name
- Enter address
- Select multiple images (up to 5)
- Image preview with remove option
- Upload images to Firebase Storage
- Save property details to Firestore
- Form validation
- Loading indicator during upload
- Error handling

### 4. Image Upload
- Supports up to 5 images per property
- Images stored in Firebase Storage
- URL returned for display
- Automatic compression (quality: 0.8)

## Firestore Collection Structure

```
properties/
├── [documentId]
│   ├── propertyName (string) - e.g., "Star Hostel"
│   ├── address (string) - Full address
│   ├── imageUrls (array) - URLs of images in Storage
│   ├── ownerId (string) - Firebase Auth UID
│   └── createdAt (timestamp) - Document creation time
```

## Firebase Storage Structure

```
gs://your-project.appspot.com/
└── properties/
    └── [userId]/
        ├── image_1711350000000_0
        ├── image_1711350000000_1
        ├── image_1711350000000_2
        └── ...
```

## Testing the App

### Test Flow:

1. **Launch App** → Redirect to Login screen
2. **Sign Up** → Create new account
3. **Sign In** → Login with credentials
4. **Dashboard** → See empty state with "+" button
5. **Add Property** →
   - Enter "My Hostel"
   - Enter "123 Main St, City"
   - Select 2-3 images
   - Click "Save Property"
6. **Dashboard** → See new property card
7. **Pull to Refresh** → (Can trigger with useFocusEffect)

## Troubleshooting

### Firebase Connection Issues:

- Verify `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) is correctly placed
- Check Firebase project credentials in console
- Ensure Authentication is enabled
- Check Firestore Security Rules allow your user

### Image Picker Not Working:

- Android: Grant camera and storage permissions
- iOS: Check Info.plist for required permissions
- Verify react-native-image-picker installation

### Authentication State Not Persisting:

- Check session timeout settings in Firebase Console
- Verify auth state change listener in App.tsx
- Check device storage for persisted credentials

### Images Not Uploading:

- Verify Storage permissions in Security Rules
- Check file size (should be under 100MB)
- Verify image format (JPG, PNG, WebP)
- Check image URI format is correct

## Build for Production

### Android:

```bash
cd android
./gradlew bundleRelease
cd ..
```

### iOS:

1. Open Xcode: `open ios/STARVISTA.xcworkspace`
2. Select "STARVISTA" in targets
3. Set Signing Team
4. Product → Archive
5. Validate and upload to App Store

## Performance Optimization Tips

1. **Image Compression**: Already set to 0.8 quality
2. **Pagination**: Add pagination for large property lists
3. **Caching**: Implement local caching for properties
4. **Lazy Loading**: Load images lazily in FlatList
5. **Code Splitting**: Split navigation by feature

## Security Checklist

- [ ] Firebase Rules are production-ready (not test mode)
- [ ] No sensitive data in client code
- [ ] API keys restricted to mobile apps only
- [ ] Enable 2FA for Firebase Console
- [ ] Regular security audits of Firestore structure
- [ ] Rate limiting enabled for APIs

## Additional Features to Consider

1. **Image Gallery**: Full-screen image viewer
2. **Property Editing**: Update existing properties
3. **Delete Property**: Remove properties
4. **User Profile**: Display user info
5. **Search/Filter**: Search properties by name/address
6. **Favorites**: Mark properties as favorites
7. **Analytics**: Track user engagement
8. **Push Notifications**: Notify on new bookings
9. **Reviews/Ratings**: User feedback system
10. **Booking System**: Integration with booking engine

## Support Resources

- [React Native Docs](https://reactnative.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Navigation Docs](https://reactnavigation.org)
- [React Native Firebase Docs](https://rnfirebase.io)

## License

This project is created for property management with STARVISTA.
