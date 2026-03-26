# Firebase Configuration Error - Fix Guide

If you're getting: **`[auth/configuration-not-found]`** error when signing up, follow this exact guide.

---

## 🔴 Problem

Firebase cannot find its configuration file (`google-services.json` for Android or `GoogleService-Info.plist` for iOS).

---

## ✅ Step-by-Step Fix for Android

### Step 1: Verify Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select or create a project
3. Verify these services are **enabled**:
   - ✅ Authentication (Email/Password)
   - ✅ Firestore Database
   - ✅ Cloud Storage

### Step 2: Download Configuration File

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Under "Your apps", find your Android app or click **Add app**
3. Select **Android**
4. Enter package name: **com.starvista**
5. Leave SHA-1 blank for now
6. Click **Register app**
7. **Download google-services.json**

### Step 3: Place the File

1. Download the file to your computer
2. Navigate to your project: `STARVISTA/android/app/`
3. **Delete** the old google-services.json (if any)
4. **Replace** with the newly downloaded one

**Important:** The file MUST be at:
```
STARVISTA/
└── android/
    └── app/
        └── google-services.json    ← Must be here
```

### Step 4: Clean and Rebuild

Open terminal in `STARVISTA/` and run:

```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..

# Clear Metro cache
npm start -- --reset-cache

# In another terminal, rebuild
npm run android
```

### Step 5: Test

After the app rebuilds:
1. Click "Don't have an account? Sign Up"
2. Enter: **test@example.com** / **password123**
3. Click "Sign Up"
4. Should succeed! ✅

---

## ⚠️ Common Mistakes

| Mistake | Fix |
|---------|-----|
| File in wrong folder | Must be in `android/app/`, not `android/` |
| Using old/wrong file | Download fresh from Firebase Console |
| Gradle not cleaned | Run `./gradlew clean` in android folder |
| Wrong package name | Firebase app must match `com.starvista` |
| Not running after changes | Always run `npm run android` after changes |

---

## 🔍 Verify Setup

Check if file is in correct location:

**Windows (Command Prompt):**
```cmd
dir STARVISTA\android\app\google-services.json
```

**Mac/Linux (Terminal):**
```bash
ls -la STARVISTA/android/app/google-services.json
```

You should see the file listed. If not, it's not in the right place.

---

## 📱 For iOS Users

If you're using iOS:

1. Download `GoogleService-Info.plist` from Firebase Console
2. Open `STARVISTA/ios/STARVISTA.xcworkspace` in Xcode
3. Drag `GoogleService-Info.plist` into the project
4. Select "Copy items if needed"
5. Click "Add"
6. Run: `npm run ios`

---

## 🆘 Still Getting Error?

### Check Firebase Console

1. Go to Firebase Console → Your Project
2. Click **Project Settings** → **General**
3. Under "Your apps", you should see your Android app
4. Verify the package name is **com.starvista**

### Check File Contents

Open `STARVISTA/android/app/google-services.json` and verify:
- It contains `"package_name": "com.starvista"`
- It has `"api_key"` and `"project_id"`
- It's valid JSON (no syntax errors)

### Clear Everything and Start Fresh

```bash
# In STARVISTA folder
cd android
./gradlew cleanBuildCache
./gradlew clean
cd ..
npm install
npm start -- --reset-cache
npm run android
```

---

## 🆗 Success Signals

When Firebase is properly configured:

✅ App launches without "Configuration Error" screen
✅ You can sign up with any email
✅ You can sign in with credentials
✅ You can add properties
✅ Properties appear in dashboard

---

## 📋 Checklist

Before testing, verify:

- [ ] Downloaded `google-services.json` from Firebase Console
- [ ] Placed file in `STARVISTA/android/app/`
- [ ] Package name in Firebase is `com.starvista`
- [ ] Firebase services enabled (Auth, Firestore, Storage)
- [ ] Ran `./gradlew clean` in android folder
- [ ] Ran `npm install`
- [ ] Cleared Metro cache with `npm start -- --reset-cache`
- [ ] Rebuilt app with `npm run android`

---

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com)
- [React Native Firebase Docs](https://rnfirebase.io)
- [Android Setup Guide](https://rnfirebase.io/auth/auth-android)

---

## 📞 Still Stuck?

If it still doesn't work:

1. **Check the error message** - Look at what it says specifically
2. **Check console logs** - Look for error details in terminal
3. **Verify file exists** - Use `ls` or file explorer to confirm
4. **Try demo account** - Make sure sign in works if sign up fails
5. **Rebuild from scratch** - Delete node_modules and reinstall

**Most Common Fix:** The file is in the wrong folder or is outdated. Download fresh from Firebase Console and place in exactly `android/app/google-services.json`

