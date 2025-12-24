// src/utils/fcm.js

import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, getFCMMessaging } from "./firebase";
import { showVendorToast } from "./vendorToast";

/**
 * Register vendor FCM token safely
 * FIXES: "no active Service Worker" error
 */
export async function registerVendorFCM(shopId) {
  try {
    console.log("🔔 registerVendorFCM called:", shopId);

    if (!("serviceWorker" in navigator)) {
      console.warn("❌ Service Worker not supported in this browser");
      return;
    }

    // ✅ WAIT until service worker is ACTIVE
    const swRegistration = await navigator.serviceWorker.ready;
    console.log("✅ Service Worker ready");

    const messaging = await getFCMMessaging();
    if (!messaging) {
      console.warn("❌ Firebase messaging not available");
      return;
    }

    // Ask notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("❌ Notification permission denied");
      return;
    }

    // ✅ Get FCM token (NO re-registering SW here)
    const token = await getToken(messaging, {
      vapidKey:
        "BDKsI4LWe14YoRFaype6AxhQ7YWgap7RsfBfg0cNd8e_nfP_dmX_CsWIW8PA0iw2XVDm4XurB3jcS9SiZJ_qndU",
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      console.warn("❌ No FCM token received");
      return;
    }

    // ✅ Save token to Firestore
    await setDoc(
      doc(db, "shops", shopId, "vendorDevices", token),
      {
        token,
        platform: "web",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("✅ FCM token registered successfully");

    // 🔔 FOREGROUND MESSAGE HANDLER
    onMessage(messaging, (payload) => {
      console.log("🔔 Foreground FCM message:", payload);

      // 🔊 Play notification sound
      const audio = new Audio("/order-alert.mp3");
      audio.play().catch(() => {});

      // 🔔 Show toast notification
      showVendorToast(
        payload.notification?.title || "New Order Received 🚀"
      );
    });
  } catch (error) {
    console.error("❌ FCM error:", error);
  }
}
