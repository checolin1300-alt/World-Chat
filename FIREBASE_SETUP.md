# Firebase Configuration for Notifications

To enable Browser and Push Notifications, you must add the following variables to your `.env` file:

```env
# Firebase Config
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_VAPID_KEY=your_public_vapid_key
```

### How to get these credentials:

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Create a new project (e.g., "WorldChat").
3.  Add a **Web App** to your project.
4.  Copy the `firebaseConfig` object and map the values to the variables above.
5.  Go to **Project Settings** > **Cloud Messaging**.
6.  Under **Web configuration**, generate a key pair for **Web Push certificates**.
7.  The **Public Key** is your `VITE_FIREBASE_VAPID_KEY`.
8.  Make sure to also update the `messagingSenderId` in `public/firebase-messaging-sw.js` or ensure it's handled during your build process.
