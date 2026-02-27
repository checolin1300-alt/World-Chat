// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// Note: In production, these should match your .env values.
// The Messaging Sender ID is the most critical for the SW.
firebase.initializeApp({
    apiKey: "AIzaSyC5d2J3VZrl5jsJcNCtD1NgFhOWu_2bviI",
    authDomain: "world-chat-2793a.firebaseapp.com",
    projectId: "world-chat-2793a",
    storageBucket: "world-chat-2793a.firebasestorage.app",
    messagingSenderId: "584311762407",
    appId: "1:584311762407:web:c3c6bab0d8adedbc1d2142"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    if (payload.notification) {
        const notificationTitle = payload.notification.title || "Nuevo mensaje";
        const notificationOptions = {
            body: payload.notification.body || "Tienes un nuevo mensaje directo",
            icon: payload.notification.icon || '/icon-192.png',
            data: payload.data
        };
        self.registration.showNotification(notificationTitle, notificationOptions);
    }
});
