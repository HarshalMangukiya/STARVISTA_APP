# STARVISTA Quick Start Guide

## ⚡ 5-Minute Setup

### 1. Install Dependencies (Already Done! ✅)
```bash
npm install  # Already completed
```

### 2. Firebase Setup (Required)

#### Option A: Using Existing Firebase Project
1. Open [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing
3. **For Android**: Download `google-services.json` → Place in `android/app/`
4. **For iOS**: Download `GoogleService-Info.plist` → Place in Xcode project

#### Option B: Quick Setup Script (if available)
```bash
npx react-native-firebase-cli setup
```

**Detailed guide**: See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### 3. Enable Firebase Services
In Firebase Console, enable:
- ✅ Authentication (Email/Password)
- ✅ Firestore Database
- ✅ Cloud Storage

### 4. Run the App

**Android:**
```bash
npm run android
```

**iOS:**
```bash
npm run ios
```

**Or Terminal:**
```bash
npm start  # Starts Metro bundler
```

### 5. Login
```
Test Account:
Email: demo@test.com
Password: demo123

Or create your own!
```

## 📂 Important File Locations

| File | Purpose |
|------|---------|
| `src/config/firebase.ts` | Firebase initialization |
| `src/services/propertyService.ts` | Business logic & database operations |
| `src/screens/LoginScreen.tsx` | Authentication UI |
| `src/screens/DashboardScreen.tsx` | Property list view |
| `src/screens/AddPropertyScreen.tsx` | Add/edit property form |
| `src/styles/styles.ts` | All UI styling |
| `src/navigation/RootNavigator.tsx` | App navigation structure |
| `App.tsx` | Main app entry point |

## 🔑 Key Features at a Glance

### Authentication
```typescript
// Users can sign up and sign in
Email: any@email.com
Password: any password (min 6 chars)
```

### Add Property
```
1. Enter property name (e.g., "Star Hostel")
2. Enter address (e.g., "123 Main St, City")
3. Select images (up to 5)
4. Click "Save Property"
```

### View Properties
```
1. Dashboard shows all your properties
2. Click property card for details
3. Floating "+" button to add new
```

## 🐛 Troubleshooting Quick Fixes

### App won't start?
```bash
npm start -- --reset-cache
cd android && ./gradlew clean && cd ..
```

### Firebase errors?
1. Check `google-services.json` exists (Android)
2. Check `GoogleService-Info.plist` exists (iOS)
3. Verify services enabled in Firebase Console

### Images not uploading?
1. Check Firebase Storage security rules
2. Verify user is authenticated
3. Check image size < 100MB

### Metro bundler error?
```bash
npm start -- --reset-cache
# In another terminal:
npm run android  # or npm run ios
```

## 📁 Folder Structure

```
src/
├── config/           # Firebase setup
├── screens/          # UI screens (Login, Dashboard, AddProperty)
├── services/         # Business logic (Firebase operations)
├── navigation/       # Navigation setup (Auth, Root)
└── styles/           # Shared styles (colors, spacing, etc)
```

## 🚀 Common Tasks

### Add a New Screen
1. Create file in `src/screens/`
2. Add to navigation in `src/navigation/`
3. Import and define props

### Modify Styles
- Edit `src/styles/styles.ts`
- All colors, sizes defined there
- Easy to update brand colors

### Change Firebase Collections
- Edit `src/services/propertyService.ts`
- Collection names and structure defined there

### Add New Properties
- Edit `Property` interface in `propertyService.ts`
- Add fields to Firestore schema
- Update form in `AddPropertyScreen.tsx`

## 📱 Test Scenarios

### Scenario 1: New User
```
1. Launch app
2. Click "Don't have an account? Sign Up"
3. Enter email & password
4. Click "Sign Up"
5. Redirects to Dashboard
```

### Scenario 2: Add Property
```
1. In Dashboard, click "+" button
2. Enter "My Hostel"
3. Enter "123 Main Street"
4. Click "Add Images"
5. Select 2-3 photos
6. Click "Save Property"
7. Return to Dashboard (should see new property)
```

### Scenario 3: Persistence
```
1. Sign in with account
2. Add a property
3. Close app completely
4. Reopen app
5. Property should still be there
```

## 💡 Pro Tips

1. **Use Emulator/Device**: Always test on actual device for image picker
2. **Clear Cache**: When facing issues, use `npm start -- --reset-cache`
3. **Check Console**: Watch metro bundler terminal for error messages
4. **Firebase Rules**: Start with test mode (unrestricted) for development
5. **Image Size**: Keep images under 2MB for fast upload

## 🔐 Security Reminders

⚠️ **DO NOT**:
- Commit `google-services.json` or `GoogleService-Info.plist`
- Share Firebase API keys
- Use test mode rules in production
- Upload sensitive data to Firestore

✅ **DO**:
- Add JSON/plist files to `.gitignore`
- Use environment variables for keys
- Restrict Firestore rules by user ID
- Validate inputs on server-side

## 📞 Need Help?

1. **Setup Issues**: Check [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. **Code Issues**: Check console output and error messages
3. **Firebase Issues**: Go to [Firebase Console](https://console.firebase.google.com)
4. **React Native Issues**: Visit [React Native Docs](https://reactnative.dev)

## ✅ Pre-Launch Checklist

- [ ] Node.js >= 22.11.0 installed
- [ ] Android Studio/Xcode installed
- [ ] Firebase project created
- [ ] `google-services.json` in `android/app/` (Android)
- [ ] `GoogleService-Info.plist` in Xcode (iOS)
- [ ] Firebase services enabled (Auth, Firestore, Storage)
- [ ] Security rules updated from test mode
- [ ] Dependencies installed (`npm install`)
- [ ] App runs without errors (`npm run android` or `npm run ios`)
- [ ] Can sign up and add property
- [ ] Images upload successfully

## 🎉 You're Ready!

Start by running:
```bash
npm run android
```

Or if using iOS:
```bash
npm run ios
```

Then create an account and start adding properties! 🏠
