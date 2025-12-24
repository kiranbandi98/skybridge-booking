import React, { useEffect, useRef, useState } from "react";
import { Outlet, useParams } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../utils/firebase";
import { registerVendorFCM } from "../utils/fcm";

/**
 * VendorLayout
 * - Global layout for vendor pages
 * - Handles:
 *   1. FCM device registration
 *   2. New order alarm
 *   3. Audio unlock
 */
export default function VendorLayout() {
  const { shopId } = useParams();

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isRinging, setIsRinging] = useState(false);

  const audioRef = useRef(null);
  const prevOrderIdsRef = useRef(new Set());
  const firstSnapshotRef = useRef(true);

  /**
   * 🔔 STEP 1: Register vendor device for FCM
   * This SHOULD auto-create:
   * shops/{shopId}/vendorDevices/{token}
   */
  useEffect(() => {
    if (!shopId) return;

    console.log("🔔 VendorLayout → registering FCM for shop:", shopId);
    registerVendorFCM(shopId);
  }, [shopId]);

  /**
   * 🔊 STEP 2: Initialize alarm audio
   */
  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-order.mp3");
    audioRef.current.loop = true;
  }, []);

  /**
   * 🔓 STEP 3: Unlock audio on first user click
   * (Browser requirement)
   */
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioRef.current) return;

      audioRef.current.muted = true;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.muted = false;
          setAudioUnlocked(true);
          console.log("🔓 Audio unlocked");
        })
        .catch(() => {});

      document.removeEventListener("click", unlockAudio);
    };

    document.addEventListener("click", unlockAudio, { once: true });
    return () => document.removeEventListener("click", unlockAudio);
  }, []);

  /**
   * 🔔 STEP 4: Listen for NEW orders
   * Alarm only triggers on new document
   */
  useEffect(() => {
    if (!shopId) return;

    const ordersRef = collection(db, "shops", shopId, "orders");

    const unsub = onSnapshot(ordersRef, (snapshot) => {
      const currentIds = new Set(snapshot.docs.map((d) => d.id));

      // First snapshot = baseline only
      if (firstSnapshotRef.current) {
        prevOrderIdsRef.current = currentIds;
        firstSnapshotRef.current = false;
        return;
      }

      const prevIds = prevOrderIdsRef.current;

      currentIds.forEach((id) => {
        if (!prevIds.has(id)) {
          console.log("🆕 New order detected:", id);

          if (audioUnlocked && audioRef.current && !isRinging) {
            audioRef.current.play().catch(() => {});
            setIsRinging(true);
          }
        }
      });

      prevOrderIdsRef.current = currentIds;
    });

    return () => unsub();
  }, [shopId, audioUnlocked, isRinging]);

  /**
   * 🛑 Stop alarm
   */
  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRinging(false);
  };

  return (
    <div>
      {isRinging && (
        <button
          onClick={stopAlarm}
          style={{
            position: "fixed",
            top: 12,
            right: 12,
            zIndex: 9999,
            padding: "10px 16px",
            background: "#d32f2f",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          STOP ALARM
        </button>
      )}

      <Outlet />
    </div>
  );
}
