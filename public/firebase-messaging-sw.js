/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBolTKv0XetkbqvtlsgaI9ldfzt6ETSRws",
  authDomain: "skybridge-vendor.firebaseapp.com",
  projectId: "skybridge-vendor",
  storageBucket: "skybridge-vendor.appspot.com",
  messagingSenderId: "1020416526526",
  appId: "1:1020416526526:web:0322b9f8ae2840beddb6ef",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const notificationTitle = payload.notification?.title || "New Order";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new order",
    icon: "/logo192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
