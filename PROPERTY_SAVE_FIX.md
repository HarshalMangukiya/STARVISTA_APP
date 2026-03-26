# Fix: Property Save Error

If you're getting an error when trying to save a property, follow this guide.

---

## 🔴 Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `permission-denied` | Firestore security rules blocking write | Update rules (see below) |
| `PERMISSION_DENIED` | Storage permissions issue | Check Storage rules |
| `network-request-failed` | No internet connection | Check WiFi/mobile data |
| `UNAUTHENTICATED` | User not logged in | Sign in again |
| `NOT_FOUND` | Collection doesn't exist | Create collection in Firestore |

---

## ✅ Fix 1: Update Firestore Security Rules

**This is the most common issue!**

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Rules**

### Step 2: Update Rules

**Delete** the current rules and **replace** with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own properties
    match /properties/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Step 3: Publish

Click the **Publish** button.

---

## ✅ Fix 2: Update Cloud Storage Security Rules

1. Go to **Cloud Storage** → **Rules**
2. **Delete** current rules and **replace** with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload/download from their folder
    match /properties/{userId}/{allPaths=**} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Step 4: Publish

Click the **Publish** button.

---

## 🔍 Verify Setup

After updating rules, check in Firebase Console:

1. **Firestore Database** → Rules → Should show your new rules
2. **Cloud Storage** → Rules → Should show your new rules
3. Both should have a **green checkmark** (valid)

---

## 🧪 Test

1. Go back to the app
2. Sign in with your account
3. Try to add a property again
4. Check the console logs for error messages

---

## 📋 What the Rules Do

**Firestore Rules:**
- Allow any authenticated user to read and write properties
- Users can add/edit/delete their own properties and others' (development mode)

**Storage Rules:**
- Allow users to upload images to their own folder: `/properties/{userId}/`
- Prevents users from accessing other users' folders

---

## ⚠️ Security Note

These rules are for **development only**!

For **production**, use stricter rules:

```javascript
// Production Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /properties/{document=**} {
      // Only authenticated users can read all properties
      allow read: if request.auth != null;

      // Only the owner can write their property
      allow write: if request.auth != null &&
                      request.auth.uid == resource.data.ownerId;

      // Anyone can create with their own UID
      allow create: if request.auth != null &&
                       request.auth.uid == request.resource.data.ownerId;
    }
  }
}
```

---

## 🐛 Debugging Steps

If still getting error, check error message (in "View Details"):

### For Network Errors
- ✓ Turn off WiFi and use mobile data
- ✓ Check internet connection
- ✓ Restart the app

### For Permission Errors
- ✓ Verify Firestore rules are updated
- ✓ Verify Storage rules are updated
- ✓ Rules must say "allow write"
- ✓ Rules must be published (check for green checkmark)

### For Authentication Errors
- ✓ Sign out and sign in again
- ✓ Create a new account
- ✓ Check `auth.currentUser` in console logs

### For Not Found Errors
- ✓ Make sure Firestore Database is created
- ✓ Make sure Cloud Storage bucket exists
- ✓ Check Firebase project settings

---

## 📱 Real-Time Debugging

In the app, when saving property:

1. **Check console logs** (in Android Studio or Xcode)
2. Look for lines like:
   ```
   🚀 Starting property save process...
   👤 User ID: [your-user-id]
   📸 Images to upload: 1
   📤 Step 1: Uploading images...
   ✓ Successfully uploaded 1 images
   💾 Step 2: Saving property...
   ✓ Property saved successfully
   ```

3. If there's a ❌, the error message will show the problem

---

## ✅ Complete Checklist

Before trying again:

- [ ] Updated Firestore rules
- [ ] Updated Cloud Storage rules
- [ ] Published both rule changes
- [ ] Waited 30 seconds for rules to take effect
- [ ] Restarted the app
- [ ] Signed in again
- [ ] Trying with at least 1 image selected
- [ ] Property name is not empty
- [ ] Address is not empty

---

## 🎯 Most Common Fix

**99% of "Failed to save property" errors are fixed by:**

1. Go to Firebase Console
2. Firestore Database → Rules
3. Paste the rules from **Fix 1** above
4. Click Publish
5. Restart the app
6. Try again

---

## 📞 Still Not Working?

1. **Take a screenshot** of the error message
2. Check console logs in Android Studio / Xcode
3. Look in "View Details" for the full error
4. Post the error message in logs
5. Verify:
   - Firebase project is active
   - Authentication is enabled
   - Firestore is enabled
   - Cloud Storage is enabled

---

## 🔗 Useful Links

- [Firebase Console](https://console.firebase.google.com)
- [Firestore Security Rules Docs](https://firebase.google.com/docs/firestore/security/start)
- [Storage Security Rules Docs](https://firebase.google.com/docs/storage/security/rules-overview)

---

## 💡 Pro Tips

1. **Always check console logs** - They show exactly what's happening
2. **Test in Firebase Console** - Try adding a document manually to test rules
3. **Rules take 30 seconds** - Wait after publishing before testing
4. **Watch the status** - Look for 🚀📤💾✓❌ emojis in logs

---

**After updating rules and restarting the app, try saving a property again. It should work!** 🎉
