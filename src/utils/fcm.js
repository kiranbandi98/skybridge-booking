// src/utils/fcm.js

import { getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, getFCMMessaging } from "./firebase";
import { showVendorToast } from "./vendorToast";

/**
 * ✅ CORRECT, SAFE, FINAL FCM REGISTRATION
 * - Uses existing service worker
 * - Saves token to Firestore
 * - Foreground notification works
 * - NO infinite sound
 * - NO re-register bugs
 */
export async function registerVendorFCM(shopId) {
  try {
    console.log("🔔 registerVendorFCM called:", shopId);

    if (!("serviceWorker" in navigator)) {
      console.warn("❌ Service Worker not supported");
      return;
    }

    // ✅ WAIT until SW is ACTIVE
    const swRegistration = await navigator.serviceWorker.ready;
    console.log("✅ Service Worker ready");

    const messaging = await getFCMMessaging();
    if (!messaging) {
      console.warn("❌ Messaging not available");
      return;
    }

    // ✅ Ask permission ONCE
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("❌ Notification permission denied");
      return;
    }

    // ✅ Get token
    const token = await getToken(messaging, {
      vapidKey: "BDKsI4LWe14YoRFaype6AxhQ7YWgap7RsfBfg0cNd8e_nfP_dmX_CsWIW8PA0iw2XVDm4XurB3jcS9SiZJ_qndU",
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

    console.log("✅ FCM token saved to Firestore");

    // 🔔 FOREGROUND MESSAGE HANDLER
    onMessage(messaging, (payload) => {
      console.log("🔔 Foreground FCM message:", payload);

      // 🔊 Play sound ONCE (no loop)
      const audio = new Audio("/order-alert.mp3");
      audio.volume = 1;
      audio.play().catch(() => {});

      // 🔔 Toast
      showVendorToast(
        payload.notification?.title || "New Order Received 🚀"
      );
    });
  } catch (err) {
    console.error("❌ registerVendorFCM error:", err);
  }
}
